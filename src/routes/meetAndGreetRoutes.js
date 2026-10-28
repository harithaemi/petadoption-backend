
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


router.use(userAuth);


router.post("/", createMeetAndGreet);


router.get("/my-meetings", getMyMeetings);


router.patch("/:id/confirm", confirmMeetAndGreet);


router.patch("/:id/request-reschedule", requestReschedule);

router.patch("/:id/reschedule", rescheduleMeetAndGreet);

router.patch("/:id/status", updateMeetingStatus);

module.exports = router;
