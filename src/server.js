import dotenv from 'dotenv';
dotenv.config();
import app from "./app.js";
import { connectDB, sequelize } from "./config/db.js";
import { initModels } from "./models/initModels.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  initModels();
  
  try {
    // Re-enabled alter: true to sync new fields (boardType, etc)
    await sequelize.sync({ alter: true });
    console.log("✅ Database synced successfully with schema updates");
  } catch (error) {
    console.error("❌ Database sync failed with alter:", error.message);
    try {
      console.log("⚠️ Falling back to normal sync without alter...");
      await sequelize.sync({ alter: false });
      console.log("✅ Database synced without alter");
    } catch (fallbackError) {
      console.error("❌ Database fallback sync also failed:", fallbackError.message);
    }
  }
  
  app.listen(PORT, '0.0.0.0', () => {
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
