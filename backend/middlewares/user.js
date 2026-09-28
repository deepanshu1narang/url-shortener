const jwt = require("jsonwebtoken");

function requireAuthMiddleware(req, res, next) {
  // const authToken = req.headers.authorization;
  // const token = authToken?.startsWith("Bearer ") ? authToken.slice(7) : null;
  const token = req.cookies.token;
  if (!token)
    return res
      .status(401)
      .json({ message: "Missing token... you are not authenticated!" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireRoleMiddleware(...allowedRoles) {
  return function (req, res, next) {
    const hasAccess = allowedRoles.some((role) =>
      req.user.roles.includes(role),
    );
    if (hasAccess || req.user.roles.includes("super_admin")) {
      return next();
    }

    return res
      .status(403)
      .json({ message: "You are not authorised for this role" });
  };
}

module.exports = { requireAuthMiddleware, requireRoleMiddleware };
