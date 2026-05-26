
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Sequelize } from "sequelize";

// Ensure .env is loaded from project root (not from src/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, "../../");
dotenv.config({ path: path.join(rootPath, ".env") });

const missing = (key) => {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
};

missing("DB_NAME");
missing("DB_USER");
missing("DB_PASSWORD");

export const sequelize = new Sequelize({
  dialect: "postgres",
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  }
});

// Test connection
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error?.message || error);
    process.exit(1);
  }
};

export default sequelize;

