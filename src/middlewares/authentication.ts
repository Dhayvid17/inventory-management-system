import { config } from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";

config();
const jwtSecret = process.env.JWT_SECRET || "secret_key";

interface AuthRequest extends Request {
  user?: any;
}

//MIDDLEWARE TO AUTHENTICATE TOKEN
const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret as string) as JwtPayload;
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

//AUTHORIZATION FOR STAFF
const authorizeStaff = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && (req.user.role === "staff" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied, staff only" });
  }
};

//AUTHORIZATION FOR ADMIN
const authorizeAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied, admin only" });
  }
};

export { authenticateToken, authorizeStaff, authorizeAdmin };
