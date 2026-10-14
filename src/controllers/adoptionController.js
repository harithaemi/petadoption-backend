const AdoptionApplication = require("../models/AdoptionApplication");
const Pet = require("../models/Pets");
const sendEmail = require("../utils/sendEmail");
const createAdoptionApplication = async (req, res) => {
  try {
    const { pet } = req.body;

    if (!(await Pet.findById(pet))) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    const existing = await AdoptionApplication.findOne({
      pet,
      adopter: req.user._id,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already applied for this pet",
      });
    }

    const application = await AdoptionApplication.create({
      ...req.body,
      adopter: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Adoption application submitted",
      application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyAdoptionApplications = async (req, res) => {
  try {
    const applications = await AdoptionApplication.find({
      adopter: req.user._id,
    }).populate("pet").sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReceivedAdoptionApplications = async (req, res) => {
  try {
    const applications = await AdoptionApplication.find()
      .populate({
        path: "pet",
        match: { shelter: req.user._id },
      })
      .populate("adopter", "userName emailId");

    res.json({
      success: true,
      applications: applications.filter(app => app.pet),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};





const updateAdoptionApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["selected", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const application = await AdoptionApplication.findById(req.params.id)
      .populate("pet")
      .populate("adopter");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (!application.pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    if (!application.adopter) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found",
      });
    }

    if (
      application.pet.shelter.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to manage this application",
      });
    }

    if (
      application.adopter._id.toString() === req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot approve your own application",
      });
    }

    if (application.status === "selected") {
      return res.status(400).json({
        success: false,
        message: "This application has already been selected",
      });
    }

    if (status === "selected") {
      const updatedPet = await Pet.findOneAndUpdate(
        {
          _id: application.pet._id,
          shelter: req.user._id,
          status: "available",
        },
        { status: "adopted" },
        { new: true }
      );

      if (!updatedPet) {
        return res.status(400).json({
          success: false,
          message: "This pet is no longer available",
        });
      }
    }

    application.status = status;
    await application.save();

    const petName = application.pet.petName || "the pet";

    await sendEmail({
      to: application.email,
      subject: `Adoption application ${status}`,
      html: `
        <h2>Adoption Application Update</h2>
        <p>Hello ${application.fullName},</p>
        <p>Your adoption application for <strong>${petName}</strong>
        has been <strong>${status}</strong>.</p>
        ${
          status === "selected"
            ? "<p>Please contact the shelter to coordinate the next steps.</p>"
            : "<p>Thank you for your interest in adopting a pet.</p>"
        }
        <p>Thank you,<br>Pet Adoption Team</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: `Application ${status}`,
      application,
    });
  } catch (error) {
    console.error("Update adoption application error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update adoption application",
    });
  }
};

module.exports = {
  createAdoptionApplication,
  getMyAdoptionApplications,
  getReceivedAdoptionApplications,
  updateAdoptionApplicationStatus,
};