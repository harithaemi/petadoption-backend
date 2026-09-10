const User = require("../models/User");
const Pet = require("../models/Pets");
const FosterApplication = require("../models/FosterApplication");
const AdoptionApplication = require("../models/AdoptionApplication");

const getShelterProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    const pets = await Pet.find({
      shelter: req.user._id,
    });

    const fosterApplications = await FosterApplication.find()
      .populate({
        path: "pet",
        match: { shelter: req.user._id },
      })
      .populate("adopter", "userName emailId");

    const adoptionApplications = await AdoptionApplication.find()
      .populate({
        path: "pet",
        match: { shelter: req.user._id },
      })
      .populate("adopter", "userName emailId");

    res.status(200).json({
      success: true,
      user,
      pets,
      fosterApplications: fosterApplications.filter(
        (application) => application.pet
      ),
      adoptionApplications: adoptionApplications.filter(
        (application) => application.pet
      ),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateShelterProfile = async (req, res) => {
  try {
    const { userName, emailId } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    if (userName) {
      user.userName = userName;
    }

   
    if (emailId) {
      user.emailId = emailId;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Shelter profile updated successfully",
      user: {
        _id: updatedUser._id,
        userName: updatedUser.userName,
        emailId: updatedUser.emailId,
        role: updatedUser.role,
      },
    });
  } catch (error) {
   
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  getShelterProfile,updateShelterProfile
};