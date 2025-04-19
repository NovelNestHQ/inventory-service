import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const saveMessageToDB = async (message: string) => {
  try {
    await pool.query("INSERT INTO messages (content) VALUES ($1)", [message]);
    console.log("✅ Message saved to DB");
  } catch (error) {
    console.error("❌ Error saving message:", error);
  }
};
