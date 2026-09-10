
const Message = require("../models/Message");
const User = require("../models/User");
const Pet = require("../models/Pets");


const sendMessage = async (req, res) => {
  try {
    const { receiver, pet, message } = req.body;


    if (!receiver || !pet || !message) {
      return res.status(400).json({
        success: false,
        message: "Receiver, pet and message are required",
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

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



const getMessages = async (req, res) => {
  try {
    const { petId, userId } = req.params;

  
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
      message: error.message,
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
      const senderId = message.sender._id.toString();
      const receiverId = message.receiver._id.toString();
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
      message: error.message,
    });
  }
};


module.exports = {
  sendMessage,
  getMessages,
  getConversations,
};

