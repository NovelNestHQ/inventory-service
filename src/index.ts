import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import flash from "connect-flash";
import booksRouter from "./routes/books-prisma";

dotenv.config();
const app = express();

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: "*", // Allow all origins
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
};

app.use(cors(corsOptions));
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data
// Express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Connect flash
app.use(flash());
// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send("NovelNest Inventory Service is running!");
});

// API Routes
app.use("/api/books", booksRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Inventory Service is running on http://localhost:${PORT}`);
});
