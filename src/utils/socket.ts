import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const setupSocket = () => {
  if (!socket) {
    socket = io('http://localhost:3000'); // Replace with your server URL
  }
  return socket;
};

const getSocket = () => {
  if (!socket) {
    throw new Error('Socket.IO connection not established');
  }
  return socket;
};

const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export { setupSocket, getSocket, disconnectSocket };
