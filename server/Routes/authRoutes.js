import express from "express";
import { Login, Logout, RegisterUser } from "../Controller/AuthController.js";

const authRouter = express.Router();

authRouter.post("/registerUser", RegisterUser);
authRouter.post("/login", Login);
authRouter.post("/logout", Logout);

export default authRouter;
