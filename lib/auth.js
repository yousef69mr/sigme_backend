import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "JsonWebTokenError") {
          return res.status(401).json({ message: "Token expired" });
        } else {
          return res.status(403).json({ message: "Invalid Token" });
        }
      }
      req.token = bearerToken;
      req.user = decoded.user; // ✅ Attach the user to the request
      next();
    });
  } else {
    res.status(403).json({ message: "No token provided" });
  }
}
