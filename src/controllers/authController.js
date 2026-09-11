const express = require("express");
const {validateSignUpData} = require("../utils/errorhandller");

const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");


const Signup = async(req ,res)=>{
    try{
validateSignUpData(req);
const {userName ,emailId,password,role} = req.body;
const passwordHash = await bcrypt.hash(password, 10);
console.log(passwordHash);
const user = new User({
    userName,emailId,password:passwordHash,role
})
await user.save();
res.send("user added successfully")

    }catch(err){
res.status(400).send("error saving the user" + err.message)
    }
}
const Login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { _id: user._id },
      process.env.SECRET_TOKEN
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        userName: user.userName,
        emailId: user.emailId,
        role: user.role,
      },
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const Logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.send("logout successful");
};


const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

module.exports={Signup,Login,Logout,getProfile}