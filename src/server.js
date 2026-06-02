import dotenv from 'dotenv';
dotenv.config();
import app from "./app.js";
import { connectDB, sequelize } from "./config/db.js";
import { initModels } from "./models/initModels.js";

import { initSocket } from './shared/socket/socket.js';

import http from 'http';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  initModels();
  
  try {
    // Normal sync for production (avoids dropping tables or failing on unique constraints)
    await sequelize.sync({ alter: false });
    console.log("✅ Database synced successfully without alter");
  } catch (error) {
    console.error("❌ Database sync failed:", error.message);
  }
  
  const server = http.createServer(app);
  initSocket(server);
  
  server.listen(PORT, '0.0.0.0', () => {
    const startupLog = `[${new Date().toISOString()}] 🚀 Server running on port ${PORT}\n`;
    console.log(startupLog);
    import('fs').then(fs => {
      fs.appendFileSync('startup.log', startupLog);
    });
    console.log(`✅ PostgreSQL connected successfully`);
  });
};


// Force restart 3
startServer();
