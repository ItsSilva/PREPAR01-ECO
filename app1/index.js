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
  console.log("btnMarcoActivationForEndGame called!");

  if (currentUser.role === "Marco") {
    try {
      const response = await fetch("http://localhost:5050/responded-users");
      const respondedUsers = await response.json();
      console.log("Users who shouted Polo:", respondedUsers);

      if (!Array.isArray(respondedUsers)) {
        console.error("respondedUsers is not an array:", respondedUsers);
        return;
      }

      if (respondedUsers.length === 0) {
        console.log("No Polos have responded yet.");
        return;
      }

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

      // Create a button for each Polo that responded
      respondedUsers.forEach((user) => {
        console.log("Creating button for user:", user);

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

      console.log("Buttons created successfully.");
    } catch (error) {
      console.error("Error fetching responded users:", error);
    }
  } else {
    console.log("This function is only for Marco.");
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
let currentUser = null;

const registerUser = async (event) => {
  event.preventDefault();
  const name = document.getElementById("user-name").value;

  if (!name) {
    alert("Name is required");
    return;
  }

  try {
    const response = await fetch("http://localhost:5050/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log("User created:", data);
      currentUser = data;
      console.log("Current user set:", currentUser);
      changeToTheLoadScreen();
      socket.emit("register-user", currentUser.id);
    } else {
      console.error("Error creating user:", data);
    }
  } catch (error) {
    console.error("Network error:", error);
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

// Polo Notified
socket.on("polo-notified", (respondedUsers) => {
  console.log("Polo-notified event received:", respondedUsers);

  if (!currentUser || !currentUser.role) {
    console.error(
      "Error: currentUser is not defined or doesn't have 'role'",
      currentUser
    );
    return;
  }

  console.log("Current user role:", currentUser.role);

  if (currentUser.role === "Marco") {
    console.log("User is Marco, activating btnMarcoActivationForEndGame");
    btnMarcoActivationForEndGame();
  } else {
    console.log("User is not Marco, no action needed for polo-notified event");
  }
});

// End game
socket.on("end-game", (selectedPolo) => {
  console.log("Game ended! Selected Polo:", selectedPolo);

  const gameContainer = document.getElementById("container-rol");
  gameContainer.style.display = "none";

  const endContainer = document.getElementById("container-end");
  endContainer.style.display = "block";

  const marcoWins = selectedPolo.role === "Special-Polo";

  if (marcoWins) {
    endContainer.innerHTML = `
      <h1>Game Over</h1>
      <p>The Marco ${currentUser.name} wins! ${selectedPolo.name} has been captured.</p>
      <p>${selectedPolo.name} was the Special-Polo!</p>
    `;
  } else {
    endContainer.innerHTML = `
      <h1>Game Over</h1>
      <p>The Marco ${currentUser.name} lost!</p>
      <p>${selectedPolo.name} was just a regular Polo! The Special-Polo escaped!</p>
    `;
  }
});

document.getElementById("start-btn").addEventListener("click", registerUser);
