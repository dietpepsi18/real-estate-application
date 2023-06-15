import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

export const requireSignin = (req, res, next) => {
  try {
    //get decoded information from token
    const decoded = jwt.verify(req.headers.authorization, JWT_SECRET);

    //add user to req, so the route's controller can later access "req.user.__id"
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or Expired token" }); //401: Unauthorized status
  }
};
