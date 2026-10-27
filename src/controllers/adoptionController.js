
const mongoose = require("mongoose");
const AdoptionApplication = require("../models/AdoptionApplication");
const Pet = require("../models/Pets");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const createAdoptionApplication = async (req, res) => {
  try {
    const { pet } = req.body;

    if (!mongoose.isValidObjectId(pet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet ID",
      });
    }

    const existingPet = await Pet.findById(pet);

    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    if (existingPet.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "This pet is no longer available for adoption",
      });
    }

    if (existingPet.shelter.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot apply for your own pet",
      });
    }

    const existing = await AdoptionApplication.findOne({
      pet,
      adopter: req.user._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this pet",
      });
    }

    const application = await AdoptionApplication.create({
      ...req.body,
      pet,
      adopter: req.user._id,
      status: "pending",
    });

    const shelter = await User.findById(existingPet.shelter);

    if (shelter?.emailId) {
      try {
        const emailResult = await sendEmail({
          to: shelter.emailId,
          subject: `New adoption application for ${existingPet.petName}`,
          html: `
            <h2>New Adoption Application</h2>
            <p>Hello ${shelter.userName},</p>
            <p>You have received a new adoption application for
            <strong>${existingPet.petName}</strong>.</p>
            <p><strong>Applicant:</strong> ${application.fullName}</p>
            <p>Log in to your Pet Adoption account to review the application.</p>
            <p>Thank you,<br>Pet Adoption Team</p>
          `,
        });

        if (!emailResult.success) {
          console.error("Shelter email failed:", emailResult.error);
        }
      } catch (emailError) {
        console.error("Shelter email error:", emailError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Adoption application submitted",
      application,
    });
  } catch (error) {
    console.error("Create adoption application error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit adoption application",
    });
  }
};

const getMyAdoptionApplications = async (req, res) => {
  try {
    const applications = await AdoptionApplication.find({
      adopter: req.user._id,
    })
      .populate("pet")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Get my adoption applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch adoption applications",
    });
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

    return res.status(200).json({
      success: true,
      applications: applications.filter((app) => app.pet),
    });
  } catch (error) {
    console.error("Get received adoption applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch received applications",
    });
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

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
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

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This application has already been reviewed",
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

    if (application.adopter.emailId) {
      try {
        const emailResult = await sendEmail({
          to: application.adopter.emailId,
          subject: `Adoption application ${status}`,
          html: `
            <h2>Adoption Application Update</h2>
            <p>Hello ${application.adopter.userName},</p>
            <p>Your adoption application for
            <strong>${petName}</strong> has been
            <strong>${status}</strong>.</p>
            ${
              status === "selected"
                ? "<p>Please contact the shelter to coordinate the next steps.</p>"
                : "<p>Thank you for your interest in adopting a pet.</p>"
            }
            <p>Thank you,<br>Pet Adoption Team</p>
          `,
        });

        if (!emailResult.success) {
          console.error("Adopter email failed:", emailResult.error);
        }
      } catch (emailError) {
        console.error("Adopter email error:", emailError.message);
      }
    }

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
