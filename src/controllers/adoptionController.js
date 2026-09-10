const AdoptionApplication = require("../models/AdoptionApplication");
const Pet = require("../models/Pets");

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
      .populate("pet");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.pet.shelter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    application.status = status;
    await application.save();

    if (status === "selected") {
      await Pet.findByIdAndUpdate(application.pet._id, {
        status: "adopted",
      });
    }

    res.json({
      success: true,
      message: `Application ${status}`,
      application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAdoptionApplication,
  getMyAdoptionApplications,
  getReceivedAdoptionApplications,
  updateAdoptionApplicationStatus,
};