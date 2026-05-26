import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust this in production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Join a specific bus room for live tracking
    socket.on('joinBus', (busId) => {
      socket.join(busId);
      console.log(`📱 Socket ${socket.id} joined room: ${busId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Emit live location to all parents tracking a specific bus
 */
export const emitBusLocation = (busId, locationData) => {
  if (io) {
    io.to(busId).emit('locationUpdate', locationData);
  }
};
