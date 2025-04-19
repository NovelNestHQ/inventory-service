import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDB = async () => {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS books (
    id UUID UNIQUE PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
  );
`;
  try {
    await pool.query(createTableQuery);
    console.log("✅ Books table initialized.");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  } finally {
    await pool.end();
    console.log("Database connection closed.");
    process.exit();
  }
};

initDB();
