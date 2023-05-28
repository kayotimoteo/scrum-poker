import { User } from "./User";

export interface Room {
  id: string;
  name: string;
  reveal: boolean;
  users: User[];
}
