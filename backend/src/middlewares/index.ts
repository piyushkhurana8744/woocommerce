import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";

// No change to the code is needed here, just ensure the type definition works
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const isAuthenticated = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Get token from cookies
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      _id: string;
      role: string;
    };
    req.user = {
      _id: decoded._id,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
