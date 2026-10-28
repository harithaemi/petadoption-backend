
const express = require("express");
const router = express.Router();

const userAuth = require("../middleware/authMiddleware");

const {
  createMeetAndGreet,
  getMyMeetings,
  confirmMeetAndGreet,
  requestReschedule,
  rescheduleMeetAndGreet,
  updateMeetingStatus,
} = require("../controllers/meetAndGreetController");

// All routes require authentication
router.use(userAuth);

// Shelter creates a meeting
router.post("/", createMeetAndGreet);

// Shelter or adopter views their meetings
router.get("/my-meetings", getMyMeetings);

// Adopter confirms a meeting
router.patch("/:id/confirm", confirmMeetAndGreet);

// Adopter requests rescheduling
router.patch("/:id/request-reschedule", requestReschedule);

// Shelter proposes a new date
router.patch("/:id/reschedule", rescheduleMeetAndGreet);

// Shelter completes or cancels a meeting
router.patch("/:id/status", updateMeetingStatus);

module.exports = router;
