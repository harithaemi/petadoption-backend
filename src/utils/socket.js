const { Server } = require("socket.io");

const initialSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

   
    socket.on("joinUser", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

 
    socket.on("joinChat", ({ petId, userId, otherUserId }) => {
      const roomId = `${petId}_${[userId, otherUserId].sort().join("_")}`;

      socket.join(roomId);

      console.log("Joined chat:", roomId);
    });


    socket.on("sendMessage", (data) => {
      console.log("Message received:", data);

      const {
        sender,
        receiver,
        pet,
        message,
      } = data;

      const roomId = `${pet}_${[sender, receiver].sort().join("_")}`;

      io.to(roomId).emit("receiveMessage", {
        sender,
        receiver,
        pet,
        message,
        createdAt: new Date(),
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = initialSocket;