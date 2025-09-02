const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors"); // Changed from import to require

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configure Express CORS
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true // Important for sessions/cookies
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Store users in rooms
const users = {};
const rooms = {};

// Helper functions
function addUser(socketId, username, room) {
  const user = { id: socketId, username, room };
  users[socketId] = user;

  if (!rooms[room]) {
    rooms[room] = [];
  }
  rooms[room].push(user);

  return user;
}

function removeUser(socketId) {
  const user = users[socketId];
  if (user) {
    delete users[socketId];
    rooms[user.room] = rooms[user.room].filter((u) => u.id !== socketId);
    if (rooms[user.room].length === 0) {
      delete rooms[user.room];
    }
  }
  return user;
}

function getRoomUsers(room) {
  return rooms[room] ? rooms[room].map((user) => user.username) : [];
}

// Handle socket connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle joining a room
  socket.on("join room", ({ username, room }) => {
    console.log(`${username} joining ${room}`);

    // Add user to room
    const user = addUser(socket.id, username, room);
    socket.join(room);

    // Send welcome message to user
    socket.emit("status message", `Welcome to ${room} room!`);

    // Broadcast to others in room that user joined
    socket.to(room).emit("status message", `${username} joined the room`);

    // Send updated user list to room
    io.to(room).emit("room users", getRoomUsers(room));
  });

  // Handle chat messages
  socket.on("chat message", (data) => {
    const user = users[socket.id];
    if (user && user.room === data.room) {
      console.log(
        `Message in ${data.room} from ${data.username}: ${data.text}`
      );

      // Send message to all users in the room
      io.to(data.room).emit("chat message", {
        text: data.text,
        username: data.username,
        senderId: socket.id,
      });
    }
  });

  // Handle leaving a room
  socket.on("leave room", ({ username, room }) => {
    console.log(`${username} leaving ${room}`);

    socket.leave(room);
    const user = removeUser(socket.id);

    if (user) {
      // Broadcast to room that user left
      socket.to(room).emit("status message", `${username} left the room`);

      // Send updated user list to room
      io.to(room).emit("room users", getRoomUsers(room));
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const user = removeUser(socket.id);
    if (user) {
      // Broadcast to room that user left
      socket
        .to(user.room)
        .emit("status message", `${user.username} left the room`);

      // Send updated user list to room
      io.to(user.room).emit("room users", getRoomUsers(user.room));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
