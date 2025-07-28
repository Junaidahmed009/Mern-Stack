// Import JWT to decode and verify tokens
import jwt from "jsonwebtoken";

/**
 * Middleware: userAuth
 * ---------------------
 * Purpose:
 *  - Protect routes by checking if the incoming request has a valid JWT token.
 *  - The token is stored in the user's cookies and verified using the secret key.
 *  - If valid, attach the user's ID to the request body for use in route handlers.
 */
const userAuth = async (req, res, next) => {
  // 1. Get the token from cookies
  const { token } = req.cookies;

  // 2. If token is not found, return unauthorized response
  if (!token) {
    return res.json({ success: false, message: "Not Authorized. Login Again" });
  }

  try {
    // 3. Decode and verify the token using your secret key (from .env)
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    // 4. If the decoded token contains a user ID, attach it to req.body
    if (tokenDecode.id) {
      req.userId = tokenDecode.id; // pass userId to next middleware/route
    } else {
      return res.json({
        success: false,
        message: "Not Authorized. Login Again",
      });
    }

    // 5. All good! Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // 6. If any error occurs (e.g., invalid/expired token), return error response
    return res.json({ success: false, message: error.message });
  }
};

// Export the middleware so you can use it in protected routes
export default userAuth;
