import dotenv from "dotenv";
import express from "express";
import { PrismaClient } from "@prisma/client";
import { pushToQueue } from "../rabbitmq";
import { BookEvent } from "../types";
import verifyToken from "../middleware";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();

// Function to fetch a book by ID
async function getBookById(bookId: string) {
  // Step 1: Get the book info to get the authorId and genreId
  const bookInfo = await prisma.book.findUnique({
    where: { id: bookId },
  });
  if (!bookInfo) {
    throw new Error("Book not found");
  }
  const { authorId, genreId } = bookInfo;
  // Step 2: Get the author and genre info
  const author = await prisma.author.findUnique({
    where: { id: authorId },
  });
  if (!author) {
    throw new Error("Author not found");
  }
  const genre = await prisma.genre.findUnique({
    where: { id: genreId },
  });
  if (!genre) {
    throw new Error("Genre not found");
  }

  // Step 3: Return the book info along with author and genre
  return {
    id: bookInfo.id,
    title: bookInfo.title,
    author: {
      id: author.id,
      name: author.name,
    },
    genre: {
      id: genre.id,
      name: genre.name,
    },
    userId: bookInfo.userId,
    createdAt: bookInfo.createdAt,
    updatedAt: bookInfo.updatedAt,
  };
}

// Function to create a book
async function createBook(
  userId: string,
  title: string,
  authorName: string,
  genreName: string
) {
  // Find or create the author
  let author = await prisma.author.findUnique({ where: { name: authorName } });
  if (!author) {
    author = await prisma.author.create({ data: { name: authorName } });
  }

  // Find or create the genre
  let genre = await prisma.genre.findUnique({ where: { name: genreName } });
  if (!genre) {
    genre = await prisma.genre.create({ data: { name: genreName } });
  }

  // Create the book with relations
  const newBook = await prisma.book.create({
    data: {
      userId,
      title,
      author: { connect: { id: author.id } },
      genre: { connect: { id: genre.id } },
    },
  });

  // Push event to queue
  if (newBook) {
    const event: BookEvent = {
      eventType: "BOOK_CREATED",
      timestamp: new Date().toISOString(),
      data: {
        book_id: newBook.id,
        user_id: newBook.userId,
        title: newBook.title,
        created_at: newBook.createdAt,
        updated_at: newBook.updatedAt,
        author: { id: newBook.authorId, name: author.name },
        genre: { id: newBook.genreId, name: genre.name },
      },
    };
    await pushToQueue(event);
  }

  return newBook;
}

// Function to update a book
async function updateBook(
  bookId: string,
  userId: string,
  title: string,
  authorName: string,
  genreName: string
) {
  // Step 1: Find the existing book to get current authorId and genreId
  const existingBook = await prisma.book.findUnique({
    where: { id: bookId },
    select: { userId: true, authorId: true, genreId: true },
  });

  if (!existingBook) {
    throw new Error("Book not found");
  }

  // Check if the user is the owner of the book
  if (existingBook.userId !== userId) {
    throw new Error("Forbidden: You are not allowed to edit this book");
  }

  let { authorId, genreId } = existingBook;

  const author = await prisma.author.upsert({
    where: { name: authorName },
    update: {}, // If author exists, do nothing
    create: { name: authorName },
  });
  authorId = author.id;

  const genre = await prisma.genre.upsert({
    where: { name: genreName },
    update: {}, // If genre exists, do nothing
    create: { name: genreName },
  });
  genreId = genre.id;

  // Step 4: Update the Book table
  const updatedBook = await prisma.book.update({
    where: { id: bookId },
    data: {
      title,
      authorId,
      genreId,
    },
  });

  // Step 5: Push event to queue
  if (updatedBook) {
    const event: BookEvent = {
      eventType: "BOOK_UPDATED",
      timestamp: new Date().toISOString(),
      data: {
        book_id: updatedBook.id,
        user_id: updatedBook.userId,
        title: updatedBook.title,
        created_at: updatedBook.createdAt,
        updated_at: updatedBook.updatedAt,
        author: { id: updatedBook.authorId, name: authorName },
        genre: { id: updatedBook.genreId, name: genreName },
      },
    };
    await pushToQueue(event);
  }

  return updatedBook;
}

// Function to delete a book
async function deleteBook(userId: string, bookId: string) {
  // Find the existing book
  const existingBook = await prisma.book.findUnique({
    where: { id: bookId },
    select: { userId: true },
  });

  if (!existingBook) {
    throw new Error("Book not found");
  }
  // Check if the user is the owner of the book
  if (existingBook.userId !== userId) {
    throw new Error("Forbidden: You are not allowed to delete this book");
  }

  const deletedBook = await prisma.book.delete({ where: { id: bookId } });

  // Push event to queue
  if (deletedBook) {
    const event: BookEvent = {
      eventType: "BOOK_DELETED",
      timestamp: new Date().toISOString(),
      data: {
        book_id: deletedBook.id,
        user_id: deletedBook.userId,
      },
    };
    await pushToQueue(event);
  }

  return deletedBook;
}

// Route: POST /api/books (Create a new book)
router.post("/", verifyToken, async (req, res): Promise<any> => {
  const { title, author, genre } = req.body;
  const { userId } = req.user; // Get user ID from the token

  if (!title || !author || !genre) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const newBook = await createBook(userId, title, author, genre);
    console.log("✅ Successfully created book:", newBook.id);
    res.status(201).json({
      success: true,
      message: "Book created successfully",
      book: newBook,
    });
  } catch (error) {
    console.error("❌ Error creating book:", error);
    res.status(500).json({ success: false, message: "Failed to create book" });
  }
});

// Route: PUT /api/books/:id (Update a book)
router.put("/:id", verifyToken, async (req, res): Promise<any> => {
  const { id } = req.params;
  const { userId } = req.user; // Get user ID from the token
  const { title, author, genre } = req.body;

  try {
    const updatedBook = await updateBook(id, userId, title, author, genre);
    console.log("✅ Successfully updated book:", updatedBook.id);
    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      book: updatedBook,
    });
  } catch (error: any) {
    console.error("❌ Error updating book:", error);

    // Return 404 status code if the book is not found
    if (error.message === "Book not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    // Return 403 status code for permission issues
    if (error.message.startsWith("Forbidden")) {
      return res.status(403).json({ success: false, message: error.message });
    }

    // Default error response
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Route: DELETE /api/books/:id (Delete a book)
router.delete("/:id", verifyToken, async (req, res): Promise<any> => {
  const { id } = req.params;
  const { userId } = req.user; // Get user ID from the token

  try {
    const deletedBook = await deleteBook(userId, id);
    console.log("✅ Successfully deleted book:", deletedBook.id);
    res
      .status(200)
      .json({ success: true, message: "Book deleted successfully" });
  } catch (error: any) {
    console.error("❌ Error deleting book:", error);

    // Return 404 status code if the book is not found
    if (error.message === "Book not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    // Return 403 status code for permission issues
    if (error.message.startsWith("Forbidden")) {
      return res.status(403).json({ success: false, message: error.message });
    }

    // Default error response
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Route: GET /api/books/:id (Get a book by ID)
router.get("/:id", verifyToken, async (req, res): Promise<any> => {
  const { id } = req.params;
  try {
    const book = await getBookById(id);
    console.log("✅ Successfully fetched book:", book.id);
    res.status(200).json({ success: true, data: book });
  } catch (error: any) {
    console.error("❌ Error fetching book:", error);

    // Return 404 status code if the book is not found
    if (error.message === "Book not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    // Default error response
    res.status(500).json({ success: false, message: error?.message });
  }
});

export default router;
