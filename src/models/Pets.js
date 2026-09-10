const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    petName: {
      type: String,
      required: true,
      trim: true,
    },
   images: {
  type: [String],
  required: true,
},
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    breed: {
      type: String,
      trim: true,
    },
    ownerEmail: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    about: {
      type: String,
      required: true,
    },
    shelter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "adopted", "fostered"],
      default: "available",
    },
    ratingAverage: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Pet", petSchema);