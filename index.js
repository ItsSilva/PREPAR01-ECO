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
let respondedUsers = [];
let gameInProgress = false;

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

  if (users.length >= 3 && !gameInProgress) {
    gameInProgress = true;
    startCountdown();
  }
});

// Function to start the countdown
const startCountdown = () => {
  let count = 3;
  const countdownInterval = setInterval(() => {
    io.emit("countdown", count);
    count--;

    if (count < 0) {
      clearInterval(countdownInterval);
      io.emit("start-game", users);
    }
  }, 1000);
};

// Function to start the reset countdown
const startResetCountdown = () => {
  let count = 5;
  const resetCountdownInterval = setInterval(() => {
    io.emit("reset-countdown", count);
    count--;

    if (count < 0) {
      clearInterval(resetCountdownInterval);
      users = [];
      respondedUsers = [];
      gameInProgress = false;

      io.emit("reset-game");
    }
  }, 1000);
};

// Post /notify-marco
app.post("/notify-marco", (req, res) => {
  const { id } = req.body;
  const marco = users.find((user) => user.id === id);
  if (marco) {
    io.emit("marco-notified", marco);
    io.emit("marco-shouted");
    res.json({ message: "Marco notified" });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Post /notify-polo
app.post("/notify-polo", (req, res) => {
  const { id } = req.body;
  const polo = users.find((user) => user.id === id);
  if (polo) {
    if (!respondedUsers.some((user) => user.id === polo.id)) {
      respondedUsers.push(polo);
    }

    // Marco receives the updated list
    io.emit("polo-notified", respondedUsers);

    res.json({ message: "Polo notified" });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Get /responded-users
app.get("/responded-users", (req, res) => {
  res.json(respondedUsers);
});

// Post /notification Marco select a polo
app.post("/notification", (req, res) => {
  const { id } = req.body;
  const polo = users.find((user) => user.id === id);
  if (polo) {
    io.emit("notification", polo);
    res.json({ message: "Polo selected" });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Post /end-game
app.post("/end-game", (req, res) => {
  const { id } = req.body;
  const selectedPolo = users.find((user) => user.id === id);
  if (selectedPolo) {
    io.emit("end-game", selectedPolo);

    startResetCountdown();

    res.json({ message: "Game ended", selectedPolo });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("register-user", (userId) => {
    const user = users.find((user) => user.id === userId);
    if (user) {
      user.socketId = socket.id;
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const disconnectedUserIndex = users.findIndex(
      (user) => user.socketId === socket.id
    );
    if (disconnectedUserIndex !== -1) {
      users.splice(disconnectedUserIndex, 1);
      console.log("User removed from game. Remaining users:", users.length);
    }
  });
});

httpServer.listen(5050, () => {
  console.log("Server running on http://localhost:5050");
});
