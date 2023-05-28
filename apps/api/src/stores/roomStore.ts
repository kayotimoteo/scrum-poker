import { Room } from "../models/Room";
import { createStore } from "zustand/vanilla";

interface RoomState {
  rooms: Room[];
  setRooms: (data: Room) => void;
}

export const roomStore = createStore<RoomState>((set) => ({
  rooms: [],
  setRooms: (data: Room) => set((state) => ({ rooms: [...state.rooms, data] })),
}));
