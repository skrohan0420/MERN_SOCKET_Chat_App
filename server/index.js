const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });


mongoose.connect("mongodb+srv://BecGbWLy2urBa0gE:BecGbWLy2urBa0gE@rohan.baf7f9w.mongodb.net/chatApp")
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error("MongoDB connection error:", err));

app.use(cors());
app.use(express.json());

// Get all messages
app.get("/messages", async (req, res) => {
	const messages = await Message.find().sort({ timestamp: 1 });
	res.json(messages);
});

// Socket.IO connection
io.on("connection", (socket) => {
	console.log("New client:", socket.id);

	socket.on("chat:message", async (msg) => {
		const newMessage = new Message(msg);
		await newMessage.save();
		io.emit("chat:message", newMessage); // Broadcast to all
	});

	socket.on("disconnect", () => {
		console.log("Client disconnected:", socket.id);
	});
});

server.listen(5000, () => {
	console.log("Server running on http://localhost:5000");
});
