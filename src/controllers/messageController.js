
const mongoose = require("mongoose");
const sendEmail = require("../utils/sendEmail");
const Message = require("../models/Message");
const User = require("../models/User");
const Pet = require("../models/Pets");

const sendMessage = async (req, res) => {
  try {
    const { receiver, pet, message } = req.body;

    if (!receiver || !pet || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Receiver, pet and message are required",
      });
    }

    if (
      !mongoose.isValidObjectId(receiver) ||
      !mongoose.isValidObjectId(pet)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver or pet ID",
      });
    }

    if (receiver.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot send messages to yourself",
      });
    }

    const existingUser = await User.findById(receiver);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    const existingPet = await Pet.findById(pet);

    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver,
      pet,
      message: message.trim(),
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "userName emailId")
      .populate("receiver", "userName emailId")
      .populate("pet", "petName image");

    if (existingUser.emailId) {
      try {
        const emailResult = await sendEmail({
          to: existingUser.emailId,
          subject: `New message about ${existingPet.petName}`,
          html: `
            <h2>You have a new message!</h2>
            <p>Hello, ${existingUser.userName}</p>
            <p><strong>${populatedMessage.sender.userName}</strong> sent you a new message regarding <strong>${existingPet.petName}</strong>.</p>
            <p>Log in to your Pet Adoption account to view and reply to the message.</p>
            <p>Thank you,<br>Pet Adoption Team</p>
          `,
        });

        if (emailResult && !emailResult.success) {
          console.error("Email notification failed:", emailResult.error);
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { petId, userId } = req.params;

    if (
      !mongoose.isValidObjectId(petId) ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pet or user ID",
      });
    }

    const existingPet = await Pet.findById(petId);

    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const messages = await Message.find({
      pet: petId,
      $or: [
        {
          sender: req.user._id,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: req.user._id,
        },
      ],
    })
      .populate("sender", "userName emailId")
      .populate("receiver", "userName emailId")
      .populate("pet", "petName image")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId },
      ],
    })
      .populate("sender", "userName emailId")
      .populate("receiver", "userName emailId")
      .populate("pet", "petName image")
      .sort({ createdAt: -1 });

    const conversations = [];
    const conversationMap = new Map();

    messages.forEach((message) => {
      if (!message.sender || !message.receiver || !message.pet) {
        return;
      }

      const senderId = message.sender._id.toString();
      const petId = message.pet._id.toString();

      const otherUser =
        senderId === currentUserId.toString()
          ? message.receiver
          : message.sender;

      const conversationKey = `${otherUser._id}_${petId}`;

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          user: otherUser,
          pet: message.pet,
          lastMessage: message.message,
          lastMessageTime: message.createdAt,
        });
      }
    });

    conversationMap.forEach((conversation) => {
      conversations.push(conversation);
    });

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
};
