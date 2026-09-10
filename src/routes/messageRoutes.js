
const express = require("express");

const {
  sendMessage,
  getMessages,
  getConversations,
} = require("../controllers/messageController");

const userAuth = require("../middleware/authMiddleware");

const router = express.Router();


router.get("/", userAuth, getConversations);


router.post("/", userAuth, sendMessage);

router.get("/:petId/:userId", userAuth, getMessages);

module.exports = router;

