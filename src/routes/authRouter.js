const express = require("express")
const authRouter =express.Router();
const{Signup,Login,Logout,getProfile} =require("../controllers/authController")
const User = require("../models/User")
const userAuth = require("../middleware/authMiddleware");

authRouter.post("/signup", Signup)
authRouter.post("/login", Login)
authRouter.post("/logout", Logout)
authRouter.get("/profile", userAuth, getProfile);
module.exports=authRouter;