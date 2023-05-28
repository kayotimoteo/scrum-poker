export interface CreateRoomPayload {
  room: string;
}

export interface ResultCreateRoomPayload {
  roomIsValid: boolean;
}

export interface VotePayload {
  room: string;
  user_id: string;
  vote: number;
}

export interface JoinPayload {
  room: string;
  nickname: string;
  spectate: boolean;
}
