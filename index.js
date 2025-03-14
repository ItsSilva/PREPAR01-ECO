const express = require("express");
const path = require("path");
const { Server } = require("socket.io");
const { createServer } = require("http");
const { error } = require("console");

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  // westa es una instancia de Socket.io en nuestro servidor
  path: "/rea-time",
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use("/app1", express.static(path.join(__dirname, "app1")));

let users = [];

//Get route to get all users
app.get("/users", (req, res) => {
  res.send(users);
});

//Post route to create a new user
app.post("/users", (req, res) => {
  const { name } = req.body;
  console.log(name);

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const id = users.length + 1;

  const roleList = ["Marco", "Polo", "Special-Polo"];

  const getRandomRole = () => {
    const randomRoles = Math.floor(Math.random() * roleList.length);
    return roleList[randomRoles];
  };

  const user = { id, name, role: getRandomRole() };
  users.push(user);
  res.status(201).json(user);
});

io.on("connection", (socket) => {
  socket.on("coordenadas", (data) => {
    console.log(data);
    io.emit("coordenadas", data);
  });
  socket.on("notificar-a-todos", (data) => {});
});

httpServer.listen(5050);
