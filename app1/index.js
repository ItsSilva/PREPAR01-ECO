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
const changeToTheGameScreen = () => {
  const loadContainer = document.getElementById("load-container");
  loadContainer.style.display = "none";

  const gameContainer = document.getElementById("container-rol");
  gameContainer.style.display = "block";

  const userInfoContainer = document.getElementById("user-info");
  userInfoContainer.innerHTML = `
    <h1>${currentUser.name}</h1>
    <p>Your role is:</p>
    <h2>${currentUser.role}</h2>
  `;

  if (currentUser.role === "Marco") {
    const marcoButton = document.createElement("button");
    marcoButton.className = "btn-marco";
    marcoButton.style.display = "block";
    marcoButton.textContent = "Marco!";
    marcoButton.addEventListener("click", async () => {
      // Post Marco screen notification to all users
      const response = await fetch("http://localhost:5050/notify-marco", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: currentUser.id }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Marco screen!", data);
        currentUser = data;
        marcoButton.style.display = "none";
      } else {
        console.error("Error", data);
      }
    });
    userInfoContainer.appendChild(marcoButton);
  }
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
let currentUser = null; // Current user information

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
    currentUser = data;
    changeToTheLoadScreen();
  } else {
    console.error("Error", data);
  }
};

// Listening to server events
// New user registered
socket.on("user-registered", (users) => {
  console.log("New user registered:", users);
});

// Countdown
socket.on("countdown", (count) => {
  const countdownElement = document.getElementById("countdown");
  if (countdownElement) {
    countdownElement.textContent = `Game starting in ${count} seconds...`;
  }
});

// Start game
socket.on("start-game", (users) => {
  console.log("Game started with users:", users);
  changeToTheGameScreen();
});

// Marco Screen
socket.on("marco-notified", (users) => {
  console.log("Users, Marco screen!", users);
});

document.getElementById("start-btn").addEventListener("click", registerUser);
