const jwt = require("jsonwebtoken");
const User = require("../models/user");
const RevokedToken = require("../models/revokedToken");

function getJWTtoken(user) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return token;
}

async function handleUserSignup(req, res) {
  const { name, password, email } = req.body;
  const user = await User.create({
    name,
    email,
    password,
  });

  const token = getJWTtoken(user);

  //   return res.render("home");
  return res.status(201).json({
    message: "User created succesfully",
    id: user._id,
    token,
  });
}

async function handleSignIn(req, res) {
  const { password, email } = req.body;

  const user = await User.findOne({ email, password });
  if (!user) {
    return res.status(404).json({ message: "Invalid email or password" });
  }

  const token = getJWTtoken(user);

  return res.status(200).json({
    message: "Welcome back to the url shortener!",
    id: user._id,
    token,
  });
}

async function handleSignOut(req, res) {
  const token = req.headers.authorization.slice(7); // strip "Bearer "

  await RevokedToken.create({
    token,
    expiresAt: new Date(req.user.exp * 1000),
  });

  return res.status(200).json({ message: "Signed out" });
}

module.exports = { handleUserSignup, handleSignIn, handleSignOut };
