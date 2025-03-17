const socket = io("http://localhost:5050", { path: "/rea-time" });

// Load screen
const loadScreen = () => {
  const loadContainer = document.getElementById("load-container");
  loadContainer.style.display = "block";
  loadContainer.innerHTML = `
    <p>Waiting for other players to connect</p>
    `;
};

// Change to game screen
const changeToTheGameScreen = (data) => {
  const loadContainer = document.getElementById("load-container");
  loadContainer.style.display = "none";

  const gameContainer = document.getElementById("container-rol");
  gameContainer.style.display = "block";

  const usersList = document.getElementById("users-list");
  usersList.innerHTML = "";
  data.forEach((user) => {
    const userElement = document.createElement("li");
    userElement.textContent = `${user.name} - ${user.role}`;
    usersList.appendChild(userElement);
  });
};

// Change to load screen
const changeToTheLoadScreen = (data) => {
  const nameInput = document.getElementById("user-name");
  const registerContainer = document.getElementById("container-start");

  if (nameInput !== null && nameInput.value) {
    registerContainer.style.display = "none";
    loadScreen(data);
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
    changeToTheLoadScreen(data);
  } else {
    console.error("Error", data);
  }

  // Start the game with post and socket
  if (data.length >= 3) {
    const response = await fetch("http://localhost:5050/start-game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    if (response.ok) {
      socket.emit("start-game", changeToTheGameScreen(data));
      console.log("Game started", data);
    } else {
      console.error("Error", data);
    }
  }
};

document.getElementById("start-btn").addEventListener("click", registerUser);
