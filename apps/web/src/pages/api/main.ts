import { Server } from "socket.io";

interface Users {
  id: string;
  room: string;
  nickname: string;
  value: number;
}

let users: Users[] = [];

export default function SocketHandler(req, res) {
  // It means that socket server was already initialised
  if (res.socket.server.io) {
    console.log("Already set up");
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  const onConnection = (socket) => {
    console.log("Conectando:", socket.id);

    socket.on("join", (payload) => {
      console.log("Entrando na sala: ", payload.room);
      let user = users.find((x) => x.id === socket.id);
      if (!user) {
        users.push({
          nickname: payload.nickname,
          value: payload.value,
          id: socket.id,
          room: payload.room,
        });
      } else {
        const roomIndex = users.findIndex((x) => x.id === socket.id);
        users[roomIndex] = {
          nickname: payload.nickname,
          value: payload.value,
          id: socket.id,
          room: payload.room,
        };
      }
      console.log(users);
      io.in(socket.id).socketsJoin(payload.room);
      io.to(payload.room).emit(
        "voteReceived",
        users.filter((x) => x.room === payload.room)
      );
    });

    socket.on("vote", (payload2) => {
      console.log("Registrando voto:", payload2);
      const roomIndex = users.findIndex((x) => x.id === socket.id);
      users[roomIndex] = {
        nickname: payload2.nickname,
        value: payload2.value,
        id: socket.id,
        room: payload2.room,
      };
      const hiddenResult = users
        .filter((x) => x.room === payload2.room)
        .map((item) => {
          if (item.value !== 0) {
            return {
              ...item,
              value: 1000,
            };
          }
          return item;
        });
      io.to(payload2.room).emit("voteReceived", hiddenResult);
    });

    socket.on("disconnecting", async (reason) => {
      const room = users.find((x) => x.id === socket.id);
      users = users.filter((x) => x.id !== socket.id);
      if (room) {
        io.to(room.room).emit("voteReceived", users);
      }
      // for (const room of socket.rooms) {
      //   if (room === socket.id) {
      //     console.log(room);
      //     // console.log("user has left ", socket.id);
      //     // socket.to(room).emit("user has left", socket.id);
      //     // rooms = rooms.filter
      //   }
      // }
    });

    socket.on("reveal", async (payload3) => {
      const getUser = users.find((x) => x.id === socket.id);

      io.to(getUser.room).emit(
        "voteReceived",
        users.filter((x) => x.room === getUser.room)
      );
    });

    socket.on("disconnect", (reason) => {
      console.log(reason);
    });
  };

  // Define actions inside
  io.on("connection", onConnection);

  console.log("Setting up socket");
  res.end();
}
