const { Socket } = require("dgram");
const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const app = new express();
const server = http.createServer(app);
const io = socketio(server);
const { generateMessage, generateLocation } = require("./util/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./util/users");

const port = process.env.PORT | 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));
let count = 0;
io.on("connection", (socket) => {
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(
          "Admin",
          `Boss ${user.username} virundaali vandu irukaanga`
        )
      );
    callback();
  });

  socket.on("reply", (reply, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    if (filter.isProfane(reply)) {
      return callback("Ketta vartha pesadeenga dholare");
    }

    io.to(user.room).emit("message", generateMessage(user.username, reply));
    callback();
  });
  socket.on("location", (pos, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationmsg",
      generateLocation(
        user.username,
        `https://google.com/maps?q=${pos.latitude},${pos.longitude}`
      )
    );
    callback();
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
      io.to(user.room).emit(
        "message",
        generateMessage(
          "Admin",
          `kootatula pachha sattai(${user.username}) escape aavuraan`
        )
      );
    }
  });
  //   socket.emit("countUpdated", count);
  //   socket.on("increment", () => {
  //     count++;
  //     socket.emit("countUpdated", count);
  //   });
});

server.listen(port, () => {
  console.log("APP running in port: ", port);
});
