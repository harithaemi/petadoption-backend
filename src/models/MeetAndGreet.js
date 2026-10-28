
const mongoose = require("mongoose");

const meetAndGreetSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },

    shelter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    adopter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "applicationType",
    },

    applicationType: {
      type: String,
      enum: ["AdoptionApplication", "FosterApplication"],
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "proposed",
        "confirmed",
        "reschedule_requested",
        "completed",
        "cancelled",
      ],
      default: "proposed",
    },
  },
  { timestamps: true }
);

meetAndGreetSchema.index(
  { application: 1, applicationType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["proposed", "confirmed", "reschedule_requested"] },
    },
  }
);

module.exports = mongoose.model("MeetAndGreet", meetAndGreetSchema);
