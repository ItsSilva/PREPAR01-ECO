const express = require("express");
const path = require("path");
const { Server } = require("socket.io");
const { createServer } = require("http");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/real-time",
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use("/app1", express.static(path.join(__dirname, "app1")));

let users = [];

// Get route to get all users
app.get("/users", (req, res) => {
  res.send(users);
});

// Post route to create a new user
app.post("/users", (req, res) => {
  const { name } = req.body;
  console.log(name);

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const id = users.length + 1;

  const roleVerification = () => {
    const hasMarco = users.some((user) => user.role === "Marco");
    const hasSpecialPolo = users.some((user) => user.role === "Special-Polo");

    if (hasMarco && hasSpecialPolo) {
      return "Polo";
    }

    const availableRoles = [];
    if (!hasMarco) availableRoles.push("Marco");
    if (!hasSpecialPolo) availableRoles.push("Special-Polo");

    const randomIndex = Math.floor(Math.random() * availableRoles.length);
    return availableRoles[randomIndex];
  };

  const user = { id, name, role: roleVerification() };
  users.push(user);
  res.status(201).json(user);

  io.emit("user-registered", users);

  if (users.length >= 3) {
    startCountdown();
  }
});

// Function to start the countdown
const startCountdown = () => {
  let count = 5;
  const countdownInterval = setInterval(() => {
    io.emit("countdown", count);
    count--;

    if (count < 0) {
      clearInterval(countdownInterval);
      io.emit("start-game", users); // Notify all clients that the game has started
    }
  }, 1000);
};

// Post /notify-marco
app.post("/notify-marco", (req, res) => {
  const { id } = req.body;
  const marco = users.find((user) => user.id === id);
  if (marco) {
    io.emit("marco-notified", marco);
    res.json({ message: "Marco notified" });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

httpServer.listen(5050, () => {
  console.log("Server running on http://localhost:5050");
});
