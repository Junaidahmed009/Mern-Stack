import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDb from "./config/mongodb.js";
import authRouter from "./Routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;
connectDb();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true }));

app.get("/", (req, res) => res.send("API Working fine"));
app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);
});
