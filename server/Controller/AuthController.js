import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../Models/userModels.js";
import transporter from "../config/nodeMailer.js";

// Register a new user
export const RegisterUser = async (req, res) => {
  // 1. Extract user details from the request body
  const { name, email, password } = req.body;

  // 2. Check if all required fields are provided
  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing Details" });
  }

  try {
    // 3. Check if a user with the same email already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User Already Exists" });
    }

    // 4. Hash the password using bcrypt for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create a new user and save it to the database
    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    // 6. Generate a JWT token with the user's ID
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", // Token will expire in 7 days
    });

    // 7. Store the token in a cookie (sent to frontend)
    res.cookie("token", token, {
      httpOnly: true, // Cannot be accessed by JavaScript in browser
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expires in 7 days
    });

    // 8. Send a welcome email to the user using Nodemailer
    const mailoptions = {
      from: process.env.SMTP_USER, // Your SMTP email (sender)
      to: email, // Receiver's email
      subject: "Welcome to GreatStack",
      text: `Welcome to GreatStack website. Your account has been created with email: ${email}`,
    };
    await transporter.sendMail(mailoptions); // Send email

    // 9. Respond with success
    return res.json({ success: true });
  } catch (error) {
    // 10. Handle any errors and return the message
    return res.json({ success: false, message: error.message });
  }
};
//------------
// export const RegisterUser = async (req, res) => {
//   const { name, email, password } = req.body;

//   if (!name || !email || !password) {
//     return res.json({ sucess: false, message: "Missing Details" });
//   }
//   try {
//     const existingUser = await userModel.findOne({ email });
//     if (existingUser) {
//       return res.json({ sucess: false, message: "User Alredy Exists" });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new userModel({ name, email, password: hashedPassword });
//     await user.save();

//     //generating Jwt Token
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "7d",
//     });

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });
//     // Sending WElcome Email
//     const mailoptions = {
//       from: process.env.SMTP_USER,
//       to: email,
//       subject: "Welcome to GreatStack",
//       text: `Welcome to greatstack website.Your account has been created with email id:${email}`,
//     };
//     await transporter.sendMail(mailoptions);

//     return res.json({ sucess: true });
//   } catch (error) {
//     return res.json({ sucess: false, message: error.message });
//   }
// };

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

//Send Verification OTP to the Users email
export const sendVerifyOtp = async (req, res) => {
  try {
    //we dont have to write req.boy.userId bcz we are not passing directly otp we are getting it by middleware
    const userId = req.userId;
    console.log(userId); // This should log the decoded user ID

    const user = await userModel.findById(userId);
    console.log(user);

    if (user.isAccountVerified) {
      return res.json({ sucess: false, message: "Account Already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.veifyOtp = otp;
    user.veifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();
    // Sending veification otp Email
    const mailoptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Account Verification OTP",
      text: `Your OTP is ${otp}.Dont Share it with anyone.use it to verify your account`,
    };
    await transporter.sendMail(mailoptions);
    res.json({ sucess: true, message: "Verification OTP Sent on Email" });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};

//Send Verification OTP to the Users email
export const verifyEmail = async (req, res) => {
  const userId = req.userId;
  const { otp } = req.body;
  console.log(userId, otp);

  if (!userId || !otp) {
    return res.json({ sucess: false, message: "Missing Details" });
  }
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ sucess: false, message: "User not Found" });
    }
    if (user.veifyOtp === "" || user.veifyOtp !== otp) {
      return res.json({ sucess: false, message: "Invalid OTP" });
    }
    if (user.veifyOtpExpireAt < Date.now()) {
      return res.json({ sucess: false, message: "OTP Expired" });
    }
    user.isAccountVerified = true;
    user.veifyOtp = "";
    user.veifyOtpExpireAt = 0;

    await user.save();
    return res.json({ sucess: true, message: "Email verified sucessfully" });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};

//Check if user is Authanticated
export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ sucess: true });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};
//sending otp to reset password
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ sucess: false, message: "Missing Email" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ sucess: false, message: "user Not Found" });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

    await user.save();

    // Sending veification otp Email
    const mailoptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Password Reset Email",
      text: `Your OTP for resetting your password is ${otp}.Dont Share it with anyone.`,
    };
    await transporter.sendMail(mailoptions);
    res.json({ sucess: true, message: " OTP Sent on Email" });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};

//Reset User Password
export const resetpasword = async (req, res) => {
  const { email, otp, newpassword } = req.body;
  // console.log(email, otp, newpassword);
  if (!email || !newpassword || !otp) {
    return res.json({
      sucess: false,
      message: "Email,new password and otp are required ",
    });
  }
  try {
    const user = await userModel.findOne({ email });
    // console.log(user);
    if (!user) {
      return res.json({ sucess: false, message: "User Not Found" });
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ sucess: false, message: "Invalid otp" });
    }
    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ sucess: false, message: "Otp Expired" });
    }
    const hashedPassword = await bcrypt.hash(newpassword, 10);

    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();
    res.json({ sucess: true, message: "Password UpDated" });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};
