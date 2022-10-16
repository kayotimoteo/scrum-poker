import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { Socket } from "socket.io-client";

interface Users {
  id: string;
  room: string;
  nickname: string;
  value: number;
  spectate: boolean;
}

let users: Users[] = [];

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
    console.log("Entrando na sala: ", payload.room);
    let user = users.find((x) => x.id === client.id);
    if (!user) {
      users.push({
        nickname: payload.nickname,
        value: payload.value,
        id: client.id,
        room: payload.room,
        spectate: payload.spectate,
      });
    } else {
      const roomIndex = users.findIndex((x) => x.id === client.id);
      users[roomIndex] = {
        nickname: payload.nickname,
        value: payload.value,
        id: client.id,
        room: payload.room,
        spectate: payload.spectate,
      };
    }
    this.server.in(client.id).socketsJoin(payload.room);
    this.server.to(payload.room).emit(
      "voteReceived",
      users.filter((x) => x.room === payload.room)
    );
  }

  @SubscribeMessage("vote")
  handleVote(client: any, payload: any): void {
    console.log("Registrando voto:", payload);
    const roomIndex = users.findIndex((x) => x.id === client.id);
    users[roomIndex] = {
      nickname: payload.nickname,
      value: payload.value,
      id: client.id,
      room: payload.room,
      spectate: payload.spectate,
    };
    const hiddenResult = users
      .filter((x) => x.room === payload.room)
      .map((item) => {
        if (item.value !== 0) {
          return {
            ...item,
            value: 1000,
          };
        }
        return item;
      });
    this.server.to(payload.room).emit("voteReceived", hiddenResult);
  }

  @SubscribeMessage("reveal")
  handleReveal(client: any, payload: any): void {
    const getUser = users.find((x) => x.id === client.id);
    console.log(users.filter((x) => x.room === getUser.room));
    this.server.to(getUser.room).emit(
      "voteReceived",
      users.filter((x) => x.room === getUser.room)
    );
  }

  @SubscribeMessage("reset")
  handleReset(client: any, payload: any): void {
    const getUser = users.find((x) => x.id === client.id);

    users = users.map((item) => {
      if (item.room === getUser.room) {
        return {
          ...item,
          value: 0,
        };
      }
      return item;
    });

    this.server.to(getUser.room).emit(
      "voteReceived",
      users
        .filter((x) => x.room === getUser.room)
        .map((item) => {
          return {
            ...item,
            value: 0,
          };
        })
    );
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    const room = users.find((x) => x.id === client.id);
    users = users.filter((x) => x.id !== client.id);
    if (room) {
      this.server.to(room.room).emit("voteReceived", users);
    }
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }
}
