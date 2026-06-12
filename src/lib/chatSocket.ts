import { getToken } from "@/lib/auth";
import { API_BASE } from "@/config/endpoints";
import { io, type Socket } from "socket.io-client";

let sharedChatSocket: Socket | null = null;
let sharedSocketToken: string | null = null;

export function getChatSocket(): Socket {
  const token = getToken();
  if (!token) {
    throw new Error("You must be logged in to use chat.");
  }

  if (!sharedChatSocket || sharedSocketToken !== token) {
    sharedChatSocket?.disconnect();
    sharedChatSocket = io(API_BASE, {
      autoConnect: true,
      auth: { token },
      transports: ["websocket", "polling"],
    });
    sharedSocketToken = token;
  }

  return sharedChatSocket;
}
