const socket = io();

const msgForm = document.querySelector("#msgForm");
const msgText = document.querySelector("input");

const msgBtn = document.querySelector("button");
const send_location = document.querySelector("#location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

socket.on("roomData", (data) => {
  console.log(data);
  const html = Mustache.render(sidebarTemplate, {
    room: data.room,
    users: data.users,
  });
  $sidebar.innerHTML = html;
});
const autoScroll = () => {
  const $newMessage = $messages.lastElementChild;

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.scrollHeight;

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};
socket.on("message", (message) => {
  console.log(message.text);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationmsg", (url) => {
  console.log(location);
  const html = Mustache.render(locationTemplate, {
    username: url.username,
    url: url.url,
    createdAt: moment(url.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

msgForm.addEventListener("submit", (e) => {
  e.preventDefault();

  msgBtn.setAttribute("disabled", "disabled");

  const msg = e.target.elements.message.value;
  socket.emit("reply", msg, (error) => {
    msgBtn.removeAttribute("disabled");
    msgText.value = "";
    if (error) {
      return console.log(error);
    }
    console.log("Ayiyo paatutaan! paatutaan!!");
  });
});

send_location.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("adhukula ne sari pattu vara maata");
  }
  send_location.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "location",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        console.log("naama irukra idam therinju poiduchu");
        send_location.removeAttribute("disabled");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
