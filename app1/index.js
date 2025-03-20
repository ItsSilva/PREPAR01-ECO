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

const btnMarcoActivationForEndGame = async () => {
  console.log("btnMarcoActivationForEndGame called!"); // Debugging

  if (currentUser.role === "Marco") {
    try {
      const response = await fetch("http://localhost:5050/responded-users");
      const respondedUsers = await response.json();
      console.log("Users who shouted Polo:", respondedUsers); // Debugging

      const userInfoContainer = document.getElementById("user-info");
      if (!userInfoContainer) {
        console.error("The user-info container does not exist in the DOM.");
        return;
      }

      userInfoContainer.innerHTML = "";

      const text = document.createElement("p");
      text.textContent =
        "Polo screamed! Click a button to select the special Polo and end the game!";
      userInfoContainer.appendChild(text);

      respondedUsers.forEach((user) => {
        const btnSelectPolo = document.createElement("button");
        btnSelectPolo.className = "btn-select-polo";
        btnSelectPolo.textContent = user.name;
        btnSelectPolo.style.display = "block";
        btnSelectPolo.style.marginBottom = "10px";

        btnSelectPolo.addEventListener("click", async () => {
          const response = await fetch("http://localhost:5050/end-game", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: user.id }),
          });

          const data = await response.json();
          if (response.ok) {
            console.log("Game ended!", data);
          } else {
            console.error("Error", data);
          }
        });

        userInfoContainer.appendChild(btnSelectPolo);
      });
    } catch (error) {
      console.error("Error fetching responded users:", error);
    }
  } else {
    console.log("This function is only for Marco."); // Debugging
  }
};

// Button Polo Activation
const btnPoloActivation = () => {
  if (currentUser.role !== "Marco") {
    const text = document.createElement("p");
    text.textContent = "Marco screamed! Click the button to Polo!";
    document.getElementById("user-info").appendChild(text);

    const btnPolo = document.createElement("button");
    btnPolo.className = "btn-polo";
    btnPolo.textContent = "Polo!";
    btnPolo.addEventListener("click", async () => {
      const response = await fetch("http://localhost:5050/notify-polo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: currentUser.id }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Polo screen!", data);
        currentUser = data;
        btnPolo.style.display = "none";
      } else {
        console.error("Error", data);
      }
    });

    document.getElementById("user-info").appendChild(btnPolo);
  }
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
        socket.emit("marco-shouted"); // Notify the server that Marco screamed
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

    // Emit the socket ID to the server
    socket.emit("register-user", currentUser.id);
  } else {
    console.error("Error", data);
  }
};

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

// Marco Shouted
socket.on("marco-shouted", () => {
  if (currentUser.role !== "Marco") {
    btnPoloActivation();
  }
});

// Notification
socket.on("notification", (users) => {
  console.log("Users, Notification screen!", users);
  changeToTheLoadScreen();
});

// Notification Marco select a polo
socket.on("polo-notified", (respondedUsers) => {
  console.log("Polo-notified event received:", respondedUsers);
  if (currentUser.role === "Marco") {
    btnMarcoActivationForEndGame();
  }
});

// End game
socket.on("end-game", (selectedPolo) => {
  console.log("Game ended! Selected Polo:", selectedPolo);

  const gameContainer = document.getElementById("container-rol");
  gameContainer.style.display = "none";

  const endContainer = document.getElementById("container-end");
  endContainer.style.display = "block";

  endContainer.innerHTML = `
    <h1>Game Over</h1>
    <p>The Marco ${currentUser.name} selected ${selectedPolo.name}!</p>
    <p>${selectedPolo.name} is ${selectedPolo.role}!</p>
  `;
});

document.getElementById("start-btn").addEventListener("click", registerUser);
