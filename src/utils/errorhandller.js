const validator = require("validator");

const validateSignUpData =(req)=>{
    const {userName ,emailId, password} =req.body;

    if(!userName){
        throw new Error("username is required")
    }
    if(!validator.isEmail(emailId)){
        throw new Error("Email is not valid")
    }
    if(!validator.isStrongPassword(password)){
        throw new Error("please enter strong password!..")
    }

};

module.exports={validateSignUpData}