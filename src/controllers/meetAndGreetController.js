
const mongoose = require("mongoose");
const MeetAndGreet = require("../models/MeetAndGreet");
const AdoptionApplication = require("../models/AdoptionApplication");
const FosterApplication = require("../models/FosterApplication");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const applicationModels = {
  AdoptionApplication,
  FosterApplication,
};

const validId = (id) => mongoose.isValidObjectId(id);

const notifyUser = async (to, subject, html) => {
  if (!to) {
    console.warn("Meeting notification skipped: email missing");
    return;
  }

  try {
    const result = await sendEmail({ to, subject, html });

    if (!result?.success) {
      console.error("Meeting email failed:", result?.error);
    }
  } catch (error) {
    console.error("Meeting email error:", error.message);
  }
};

const formatDate = (date) =>
  new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

const getMeeting = async (id) => {
  return MeetAndGreet.findById(id)
    .populate("pet", "petName")
    .populate("shelter", "userName emailId")
    .populate("adopter", "userName emailId");
};

const createMeetAndGreet = async (req, res) => {
  try {
    const {
      applicationId,
      applicationType,
      date,
      location,
      notes,
    } = req.body;

    if (
      !validId(applicationId) ||
      !applicationModels[applicationType]
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID or type",
      });
    }

    if (
      typeof location !== "string" ||
      !location.trim() ||
      typeof date !== "string" ||
      !date.trim() ||
      (notes !== undefined && typeof notes !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid date and location are required",
      });
    }

    const meetingDate = new Date(date);

    if (
      Number.isNaN(meetingDate.getTime()) ||
      meetingDate <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Meeting date must be in the future",
      });
    }

    const Model = applicationModels[applicationType];

    const application = await Model.findById(applicationId)
      .populate("pet")
      .populate("adopter");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (!application.pet || !application.adopter) {
      return res.status(404).json({
        success: false,
        message: "Pet or applicant no longer exists",
      });
    }

    if (
      application.pet.shelter.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the pet's shelter can schedule a meeting",
      });
    }

    if (
      application.adopter._id.toString() ===
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot schedule a meeting with yourself",
      });
    }

    if (
      application.status !== "pending" ||
      application.pet.status !== "available"
    ) {
      return res.status(400).json({
        success: false,
        message: "Application or pet is no longer available",
      });
    }

    const existingMeeting = await MeetAndGreet.findOne({
      application: applicationId,
      applicationType,
      status: {
        $in: [
          "proposed",
          "confirmed",
          "reschedule_requested",
        ],
      },
    });

    if (existingMeeting) {
      return res.status(409).json({
        success: false,
        message: "An active meeting already exists",
      });
    }

    const meeting = await MeetAndGreet.create({
      pet: application.pet._id,
      shelter: req.user._id,
      adopter: application.adopter._id,
      application: applicationId,
      applicationType,
      date: meetingDate,
      location: location.trim(),
      notes: notes?.trim() || "",
      status: "proposed",
    });

    await notifyUser(
      application.adopter.emailId || application.email,
      "Meet & Greet Invitation",
      `
        <h2>Meet & Greet Invitation</h2>
        <p>Hello ${application.fullName || "Applicant"},</p>
        <p>The shelter has proposed a meeting for
        ${application.pet.petName}.</p>
        <p><strong>Date:</strong> ${formatDate(meeting.date)}</p>
        <p><strong>Location:</strong> ${meeting.location}</p>
        <p>Log in to confirm or request rescheduling.</p>
      `
    );

    return res.status(201).json({
      success: true,
      message: "Meet and greet scheduled",
      meeting,
    });
  } catch (error) {
    console.error("Create meeting error:", error);

    return res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "An active meeting already exists"
          : "Failed to schedule meeting",
    });
  }
};

const getMyMeetings = async (req, res) => {
  try {
    const meetings = await MeetAndGreet.find({
      $or: [
        { shelter: req.user._id },
        { adopter: req.user._id },
      ],
    })
      .populate("pet", "petName image")
      .populate("shelter", "userName emailId")
      .populate("adopter", "userName emailId")
      .sort({ date: 1 });

    return res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error) {
    console.error("Get meetings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch meetings",
    });
  }
};

const confirmMeetAndGreet = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meeting ID",
      });
    }

    const meeting = await MeetAndGreet.findOneAndUpdate(
      {
        _id: req.params.id,
        adopter: req.user._id,
        status: "proposed",
        date: { $gt: new Date() },
      },
      { $set: { status: "confirmed" } },
      { new: true }
    );

    if (!meeting) {
      return res.status(409).json({
        success: false,
        message: "Meeting unavailable or cannot be confirmed",
      });
    }

    const details = await getMeeting(meeting._id);

    await notifyUser(
      details.shelter?.emailId,
      "Meet & Greet Confirmed",
      `
        <h2>Meeting Confirmed</h2>
        <p>The adopter confirmed the meeting for
        ${details.pet?.petName || "the pet"}.</p>
        <p>Date: ${formatDate(details.date)}</p>
        <p>Location: ${details.location}</p>
      `
    );

    return res.status(200).json({
      success: true,
      message: "Meeting confirmed",
      meeting,
    });
  } catch (error) {
    console.error("Confirm meeting error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to confirm meeting",
    });
  }
};

const requestReschedule = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meeting ID",
      });
    }

    const meeting = await MeetAndGreet.findOneAndUpdate(
      {
        _id: req.params.id,
        adopter: req.user._id,
        status: { $in: ["proposed", "confirmed"] },
        date: { $gt: new Date() },
      },
      { $set: { status: "reschedule_requested" } },
      { new: true }
    );

    if (!meeting) {
      return res.status(409).json({
        success: false,
        message: "Meeting cannot be rescheduled",
      });
    }

    const details = await getMeeting(meeting._id);

    await notifyUser(
      details.shelter?.emailId,
      "Meet & Greet Reschedule Requested",
      `
        <h2>Reschedule Requested</h2>
        <p>The adopter has requested a new meeting time for
        ${details.pet?.petName || "the pet"}.</p>
        <p>Please log in to propose another date.</p>
      `
    );

    return res.status(200).json({
      success: true,
      message: "Reschedule request sent",
      meeting,
    });
  } catch (error) {
    console.error("Request reschedule error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to request rescheduling",
    });
  }
};

const rescheduleMeetAndGreet = async (req, res) => {
  try {
    const { date, location, notes } = req.body;

    if (
      !validId(req.params.id) ||
      typeof date !== "string" ||
      !date.trim() ||
      (location !== undefined &&
        (typeof location !== "string" || !location.trim())) ||
      (notes !== undefined && typeof notes !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid meeting details",
      });
    }

    const newDate = new Date(date);

    if (
      Number.isNaN(newDate.getTime()) ||
      newDate <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Choose a future date",
      });
    }

    const updates = {
      date: newDate,
      status: "proposed",
    };

    if (location !== undefined) {
      updates.location = location.trim();
    }

    if (notes !== undefined) {
      updates.notes = notes.trim();
    }

    const meeting = await MeetAndGreet.findOneAndUpdate(
      {
        _id: req.params.id,
        shelter: req.user._id,
        status: {
          $in: [
            "proposed",
            "confirmed",
            "reschedule_requested",
          ],
        },
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!meeting) {
      return res.status(409).json({
        success: false,
        message: "Meeting cannot be rescheduled",
      });
    }

    const details = await getMeeting(meeting._id);

    await notifyUser(
      details.adopter?.emailId,
      "Updated Meet & Greet Schedule",
      `
        <h2>Meeting Schedule Updated</h2>
        <p>A new meeting time has been proposed for
        ${details.pet?.petName || "the pet"}.</p>
        <p>Date: ${formatDate(details.date)}</p>
        <p>Location: ${details.location}</p>
        <p>Please log in to confirm the new schedule.</p>
      `
    );

    return res.status(200).json({
      success: true,
      message: "New meeting schedule proposed",
      meeting,
    });
  } catch (error) {
    console.error("Reschedule meeting error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reschedule meeting",
    });
  }
};

const updateMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (
      !validId(req.params.id) ||
      !["completed", "cancelled"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid meeting ID or status",
      });
    }

    const allowedStatuses =
      status === "completed"
        ? ["confirmed"]
        : ["proposed", "confirmed", "reschedule_requested"];

    const filter = {
      _id: req.params.id,
      shelter: req.user._id,
      status: { $in: allowedStatuses },
    };

    if (status === "completed") {
      filter.date = { $lte: new Date() };
    }

    const meeting = await MeetAndGreet.findOneAndUpdate(
      filter,
      { $set: { status } },
      { new: true }
    );

    if (!meeting) {
      return res.status(409).json({
        success: false,
        message: "Meeting cannot be updated to this status",
      });
    }

    const details = await getMeeting(meeting._id);

    await notifyUser(
      details.adopter?.emailId,
      `Meet & Greet ${status}`,
      `
        <h2>Meeting ${status}</h2>
        <p>Your meeting for
        ${details.pet?.petName || "the pet"}
        has been ${status}.</p>
      `
    );

    return res.status(200).json({
      success: true,
      message: `Meeting ${status}`,
      meeting,
    });
  } catch (error) {
    console.error("Update meeting status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update meeting status",
    });
  }
};

module.exports = {
  createMeetAndGreet,
  getMyMeetings,
  confirmMeetAndGreet,
  requestReschedule,
  rescheduleMeetAndGreet,
  updateMeetingStatus,
};
