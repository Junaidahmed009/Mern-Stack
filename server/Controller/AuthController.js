import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../Models/userModels.js";
import transporter from "../config/nodeMailer.js";

export const RegisterUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ sucess: false, message: "Missing Details" });
  }
  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ sucess: false, message: "User Alredy Exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    //generating Jwt Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Sending WElcome Email
    const mailoptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Welcome to GreatStack",
      text: `Welcome to greatstack website.Your account has been created with email id:${email}`,
    };
    await transporter.sendMail(mailoptions);

    return res.json({ sucess: true });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};

export const Login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({
      sucess: false,
      message: "Email and Password are Reqired",
    });
  }
  try {
    const UserEmail = await userModel.findOne({ email });
    if (!UserEmail) {
      return res.json({ sucess: false, message: "Invalid Email" });
    }
    const isMatch = await bcrypt.compare(password, UserEmail.password);
    if (!isMatch) {
      return res.json({ sucess: false, message: "Invalid password" });
    }
    const token = jwt.sign({ id: UserEmail._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ sucess: true });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};

export const Logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ sucess: true, message: "Logged Out" });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};
