import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Room } from "./models/Room";
import { User } from "./models/User";
import { Server } from "socket.io";
import { Socket } from "socket.io-client";

// let users: User[] = [];
let rooms: Room[] = [];

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class MainGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("message")
  handleMessage(client: any, payload: any): string {
    return "Hello world!";
  }

  @SubscribeMessage("connect")
  onConnect(client: any, payload: any): void {
    console.log(client, payload);
  }

  @SubscribeMessage("join")
  handleJoin(client: any, payload: any): void {
    console.log("Entrando na sala: ", payload);
    let roomIndex = rooms.findIndex((x) => x.id === payload.room);
    if (roomIndex <= 0) {
      rooms.push({
        id: payload.room,
        name: payload.nameRoom,
        reveal: false,
        users: [],
      });
      roomIndex = rooms.findIndex((x) => x.id === payload.room);
    }
    let user = rooms[roomIndex].users.find((x) => x.id === client.id);
    if (!user) {
      rooms[roomIndex].users.push({
        nickname: payload.nickname,
        value: payload.value,
        id: client.id,
        spectate: payload.spectate,
      });
    } else {
      const userIndex = rooms[roomIndex].users.findIndex(
        (x) => x.id === client.id
      );
      rooms[roomIndex].users[userIndex] = {
        nickname: payload.nickname,
        value: payload.value,
        id: client.id,
        spectate: payload.spectate,
      };
    }
    this.server.in(client.id).socketsJoin(payload.room);
    const hiddenResult = rooms[roomIndex].users.map((item) => {
      if (item.value !== 0) {
        return {
          ...item,
          value: 1000,
        };
      }
      return item;
    });
    this.server.to(payload.room).emit("voteReceived", {
      users: hiddenResult,
      reset: false,
      nameRoom: rooms[roomIndex].name,
    });
  }

  @SubscribeMessage("vote")
  handleVote(client: any, payload: any): void {
    console.log("Registrando voto:", payload);
    let room = rooms.find((x) => x.id === String(payload.room));
    const roomIndex = room.users.findIndex((x) => x.id === client.id);
    room.users[roomIndex] = {
      nickname: payload.nickname,
      value: payload.value,
      id: client.id,
      spectate: payload.spectate,
    };
    const hiddenResult = room.users.map((item) => {
      if (item.value !== 0) {
        return {
          ...item,
          value: 1000,
        };
      }
      return item;
    });
    this.server
      .to(payload.room)
      .emit("voteReceived", { users: hiddenResult, reset: false });
  }

  @SubscribeMessage("reveal")
  handleReveal(client: any, payload: any): void {
    let room = rooms.find((x) => x.users.find((user) => user.id === client.id));
    let roomIndex = rooms.findIndex((x) => x.id === room.id);
    rooms[roomIndex].reveal = true;
    this.server.to(room.id).emit("voteReceived", {
      users: room.users,
      reset: false,
    });
  }

  @SubscribeMessage("reset")
  handleReset(client: any, payload: any): void {
    let room = rooms.find((x) => x.users.find((user) => user.id === client.id));
    const roomIndex = rooms.findIndex((x) => x.id === room.id);
    rooms[roomIndex].reveal = false;
    rooms[roomIndex].users = room.users.map((item) => {
      return {
        ...item,
        value: 0,
      };
    });

    const result = room.users.map((item) => {
      return {
        ...item,
        value: 0,
      };
    });

    this.server
      .to(room.id)
      .emit("voteReceived", { users: result, reset: true });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    let roomIndex = rooms.findIndex((x) =>
      x.users.find((user) => user.id === client.id)
    );
    // const getUser = rooms[roomIndex].users.find((x) => x.id === client.id);
    if (roomIndex >= 0) {
      rooms[roomIndex].users = rooms[roomIndex].users.filter(
        (x) => x.id !== client.id
      );

      const hiddenResult = rooms[roomIndex].users.map((item) => {
        if (!rooms[roomIndex].reveal) {
          return {
            ...item,
            value: 1000,
          };
        }
        return item;
      });

      this.server
        .to(rooms[roomIndex].id)
        .emit("voteReceived", { users: hiddenResult, reset: true });
    }
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }
}
