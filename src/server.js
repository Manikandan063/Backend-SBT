import dotenv from 'dotenv';
dotenv.config();
import app from "./app.js";
import { connectDB, sequelize } from "./config/db.js";
import { initModels } from "./models/initModels.js";

import { initSocket } from './shared/socket/socket.js';

import http from 'http';
import cron from 'node-cron';
import { processScheduledNotifications } from './modules/notification/notification.service.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  initModels();
  
  try {
    console.log("✅ All Sequelize models initialized successfully");
    // Normal sync for production (avoids dropping tables or failing on unique constraints)
    await sequelize.sync({ alter: false });
    console.log("✅ Database synced successfully with alter: false");
  } catch (error) {
    console.error("❌ Database sync failed:", error.message);
  }

  // Initialize cron jobs
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledNotifications();
    } catch (error) {
      console.error('[CRON] Error running scheduled notifications:', error);
    }
  });
  console.log("✅ Scheduled notifications cron initialized");
  
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
