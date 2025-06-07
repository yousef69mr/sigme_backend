import jwt from "jsonwebtoken";
export function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");

    const bearerToken = bearer[1];

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, _) => {
      if (err) {
        if (err.name === "JsonWebTokenError") {
          // Handle expired token error
          return res.status(401).json({ message: "Token expired" });
        } else {
          // Handle other JWT errors
          return res.status(403).json({ message: "Invalid Token" });
        }
      }
      req.token = bearerToken;
      next();
    });
  } else {
    res.status(403).json({ message: "No token provided" });
  }
}
