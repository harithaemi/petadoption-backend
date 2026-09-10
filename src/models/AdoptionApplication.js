const mongoose = require("mongoose");

const adoptionApplicationSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },

    adopter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      required: true,
    },

    currentProfession: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    residenceType: {
      type: String,
      enum: ["House", "Apartment"],
      required: true,
    },

    petFriendly: {
      type: Boolean,
      required: true,
    },

    houseType: {
      type: String,
      enum: ["Own", "Rental"],
      required: true,
    },

    aboutYou: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "selected", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AdoptionApplication",
  adoptionApplicationSchema
);