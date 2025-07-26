import express from "express";
import {
  isAuthenticated,
  Login,
  Logout,
  RegisterUser,
  resetpasword,
  sendResetOtp,
  sendVerifyOtp,
  verifyEmail,
} from "../Controller/AuthController.js";
import userAuth from "../middleWare/userAuth.js";

const authRouter = express.Router();

authRouter.post("/registerUser", RegisterUser);
authRouter.post("/login", Login);
authRouter.post("/logout", Logout);
authRouter.post("/send-verify-otp", userAuth, sendVerifyOtp);
authRouter.post("/verify-account", userAuth, verifyEmail);
authRouter.post("/is-auth", userAuth, isAuthenticated);
authRouter.post("/send-reset-otp", sendResetOtp);
authRouter.post("/reset-password", resetpasword);

export default authRouter;
