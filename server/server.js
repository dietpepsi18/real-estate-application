import express from "express";
import morgan from "morgan";
import cors from "cors";
import { DATABASE } from "./config.js";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";

const app = express();

//connect to database
mongoose
  .connect(DATABASE)
  .then(() => console.log("database has been connected"))
  .catch((err) => console.log);

//apply middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

//apply routes middlewares (routes declaration has moved to ./routes file)
app.use("/auth", authRoutes);

//listen
app.listen(8000, () => console.log("server is running on port 8000"));
