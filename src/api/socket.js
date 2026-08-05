import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 10000,
    });
  }

  return socket;
}
