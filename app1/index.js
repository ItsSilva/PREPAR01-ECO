const socket = io("http://localhost:5050", { path: "/rea-time" });

document.getElementById("get-btn").addEventListener("click", getUsers);

function getUsers() {
  fetch("http://localhost:5050/users")
    .then((response) => response.json())
    .then((data) => console.log("get response", data))
    .catch((error) => console.error("Error:", error));
}

//Register User
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
  } else {
    console.error("Error", data);
  }
  //Change to rol screen
  const changeToTheRolScreen = () => {
    const nameInput = document.getElementById("user-name");
    const registerContainer = document.getElementById("container-start");

    if (nameInput !== null && nameInput.value) {
      registerContainer.style.display = "none";
      rolScreen();
    } else {
      alert("Name is required");
    }
  };
  changeToTheRolScreen();
};

//Rol screen
const rolScreen = () => {
  const rolContainer = document.getElementById("container-rol");
  rolContainer.style.display = "block";
};

document.getElementById("start-btn").addEventListener("click", registerUser);

const sendCoordenates = () => {
  socket.emit("coordenadas", { x: 123, y: 432 });
};

document.getElementById("event-btn").addEventListener("click", sendCoordenates);
