require("dotenv").config();
const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { DATABASE_URL } = require("./settings");
const usersRouter = require("./routes/users");
const messagesRouter = require("./routes/messages");
const tokenRouter = require("./routes/token");
const roomRouter = require("./routes/rooms");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(cors());

//Connection to Database
mongoose.connect(DATABASE_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});
const db = mongoose.connection;
db.on("error", error => console.error(error));
db.once("open", () => console.log("Connected to Database"));

// setting up the server for req with json body
app.use(express.json());

// Setting up the routes
app.use("/api/users", usersRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/token", tokenRouter);
app.use("/api/rooms", roomRouter);

//Listening on a port
const PORT = process.env.PORT || 8000;

server.listen(PORT, () =>
	console.log(`The Server is running on http://localhost:${PORT}`)
);

let totalSockets = 0;

io.on("connection", socket => {
	totalSockets++;
	console.log(
		`User is Connected ${socket.id}  || total sockets: ${totalSockets}`
	);

	socket.on("joinRoom", data => {
		socket.join(data.room_id);

		socket.broadcast
			.to(data.room_id)
			.emit("userJoin", "A User has Join the Room");

		socket.on("chatMessage", data => {
			socket.broadcast.to(data.room_id).emit("message", data.userAndMsg);
		});
	});

	socket.on("disconnect", () => {
		totalSockets--;
		console.log(
			`User disconnected: ${socket.id} || total sockets: ${totalSockets}`
		);
	});
});
