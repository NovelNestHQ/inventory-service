import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { pushToQueue } from "../rabbitmq";

dotenv.config();

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to create a book
async function createBook(
  username: string,
  title: string,
  author: string,
  genre: string
) {
  const bookId = uuidv4();
  const createdAt = new Date();
  const updatedAt = createdAt;
  const query = `
    INSERT INTO books (id, title, author, genre, username, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
  `;

  const values = [bookId, title, author, genre, username, createdAt, updatedAt];
  const { rows } = await pool.query(query, values);
  const newBook = rows[0];

  if (newBook) {
    const event = {
      eventType: "BOOK_CREATED",
      timestamp: new Date().toISOString(),
      data: newBook,
    };
    await pushToQueue(event);
  }

  return newBook;
}

// Function to update a book
async function updateBook(
  bookId: string,
  username: string,
  title?: string,
  author?: string,
  genre?: string
) {
  const updateQuery = `
    UPDATE books
    SET 
      title = COALESCE($3, title),
      author = COALESCE($4, author),
      genre = COALESCE($5, genre),
      updated_at = NOW()
    WHERE id = $1 AND username = $2
    RETURNING *;
  `;
  const values = [bookId, username, title, author, genre];
  const { rows } = await pool.query(updateQuery, values);
  const updatedBook = rows[0];

  if (updatedBook) {
    const event = {
      eventType: "BOOK_UPDATED",
      timestamp: new Date().toISOString(),
      data: updatedBook,
    };
    await pushToQueue(event);
  }

  return updatedBook;
}

// Function to delete a book
async function deleteBook(bookId: string) {
  const deleteQuery = `DELETE FROM books WHERE id = $1 RETURNING *;`;
  const { rows } = await pool.query(deleteQuery, [bookId]);
  const deletedBook = rows[0];

  if (deletedBook) {
    const event = {
      eventType: "BOOK_DELETED",
      timestamp: new Date().toISOString(),
      data: deletedBook,
    };
    await pushToQueue(event);
  }

  return deletedBook;
}

// Route: POST /api/books (Create a new book)
router.post("/", async (req, res): Promise<any> => {
  const { title, author, genre, username } = req.body;

  // Validate input
  if (!title || !author || !genre || !username) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const newBook = await createBook(username, title, author, genre);
    res.status(201).json({
      success: true,
      message: "Book created successfully",
      book: newBook,
    });
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ success: false, message: "Failed to create book" });
  }
});

// Route: PUT /api/books/:id (Update a book)
router.put("/:id", async (req, res): Promise<any> => {
  const { id } = req.params;
  const { title, author, genre, username } = req.body;

  try {
    const updatedBook = await updateBook(id, username, title, author, genre);
    if (!updatedBook) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }
    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      book: updatedBook,
    });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ success: false, message: "Failed to update book" });
  }
});

// Route: DELETE /api/books/:id (Delete a book)
router.delete("/:id", async (req, res): Promise<any> => {
  const { id } = req.params;

  try {
    const deletedBook = await deleteBook(id);
    if (!deletedBook) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ success: false, message: "Failed to delete book" });
  }
});

export default router;
