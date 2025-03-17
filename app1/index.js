const socket = io("http://localhost:5050", { path: "/real-time" });

// Load screen
const loadScreen = () => {
  const loadContainer = document.getElementById("load-container");
  loadContainer.style.display = "block";
  loadContainer.innerHTML = `
    <p>Waiting for other players to connect</p>
    <p id="countdown"></p>
  `;
};

// Change to game screen
const changeToTheGameScreen = (users) => {
  const loadContainer = document.getElementById("load-container");
  loadContainer.style.display = "none";

  const gameContainer = document.getElementById("container-rol");
  gameContainer.style.display = "block";

  const usersList = document.getElementById("users-cards");
  usersList.innerHTML = "";
  users.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.classList.add(`user-card-${user.id}`);
    userElement.innerHTML = `
      <h1>${user.name}</h1>
      <p>Your role is:</p>
      <h2>${user.role}</h2>
    `;
    usersList.appendChild(userElement);
  });
};

// Change to load screen
const changeToTheLoadScreen = () => {
  const nameInput = document.getElementById("user-name");
  const registerContainer = document.getElementById("container-start");

  if (nameInput !== null && nameInput.value) {
    registerContainer.style.display = "none";
    loadScreen();
  } else {
    alert("Name is required");
  }
};

// Register User
const registerUser = async (event) => {
  event.preventDefault();

  const name = document.getElementById("user-name").value;
  console.log(name);

  const response = await fetch("http://localhost:5050/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  const data = await response.json();
  if (response.ok) {
    console.log("User created", data);
    changeToTheLoadScreen();
  } else {
    console.error("Error", data);
  }
};

// Listening to server events
socket.on("user-registered", (users) => {
  console.log("New user registered:", users);
});

socket.on("countdown", (count) => {
  const countdownElement = document.getElementById("countdown");
  if (countdownElement) {
    countdownElement.textContent = `Game starting in ${count} seconds...`;
  }
});

socket.on("start-game", (users) => {
  console.log("Game started with users:", users);
  changeToTheGameScreen(users);
});

document.getElementById("start-btn").addEventListener("click", registerUser);
