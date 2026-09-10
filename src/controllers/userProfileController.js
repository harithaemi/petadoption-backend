const User = require("../models/User");
const FosterApplication = require("../models/FosterApplication");
const AdoptionApplication = require("../models/AdoptionApplication");

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const fosterApplications = await FosterApplication.find({
      adopter: req.user._id,
    }).populate("pet");

    const adoptionApplications = await AdoptionApplication.find({
      adopter: req.user._id,
    }).populate("pet");

    res.status(200).json({
      success: true,
      user,
      fosterApplications,
      adoptionApplications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateUserProfile = async (req, res) => {
  try {
    const { userName, emailId } = req.body;


    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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
      message: "Profile updated successfully",
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
  getUserProfile,
  updateUserProfile
};