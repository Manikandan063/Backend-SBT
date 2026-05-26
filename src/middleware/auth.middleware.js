import jwt from "jsonwebtoken";
import ParentSession from "../modules/parent/parentSession.model.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    req.user = decoded;
    
    // Single-device restriction: Only enforce for parents
    if (decoded.role === 'parent' && decoded.sessionId) {
      const activeSession = await ParentSession.findOne({ 
        where: { id: decoded.sessionId, isActive: true } 
      });
      if (!activeSession) {
        return res.status(401).json({ 
          code: 'ACTIVE_SESSION_EXISTS',
          message: "Session expired or logged in from another device." 
        });
      }
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired. Please login again." });
    }
    return res.status(403).json({ message: "Invalid token." });
  }
};
