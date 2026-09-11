require("dotenv").config();

const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http =require("http")
const app = express();

const authRouter = require("./routes/authRouter");
const uploadRouter = require("./routes/uploadRouter");
const shelterRouter = require("./routes/shelterRouter");
const adoptionRoutes = require("./routes/adoptionRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const messageRouter = require("./routes/messageRoutes");
const initialSocket = require("./utils/socket");

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
      origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/", authRouter);

app.use("/shelter", shelterRouter);

app.use("/adoption", adoptionRoutes);

app.use("/api", uploadRouter);
app.use("/reviews", reviewRouter);
app.use("/messages", messageRouter);
const server = http.createServer(app);
initialSocket(server);
connectDB()
  .then(() => {
    console.log("Database connected");

 const PORT = process.env.PORT || 7777;

server.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
  })
  .catch((err) => {
    console.log("Database cannot connect:", err.message);
  });