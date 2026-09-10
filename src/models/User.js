const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userName:{
        type:String
    },
    emailId:{
        type:String,
        lowercase:true,
        required:true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
         type: String,
          enum: ['adopter', 'shelter'],
          default: 'adopter' },
    phone: String,
  location: String,      
 
} 
 ,{ timestamps: true })



module.exports = mongoose.model('User', userSchema);