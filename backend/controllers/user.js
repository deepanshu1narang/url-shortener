const jwt = require("jsonwebtoken");
const User = require("../models/user");
const RevokedToken = require("../models/revokedToken");

function setCookie(_req, res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true once served over HTTPS
    maxAge: 60 * 60 * 1000, // 1h, matches expiresIn
  });
}

function getJWTtoken(user) {
  const token = jwt.sign(
    { id: user._id, name: user.name, roles: user.roles },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  return token;
}

async function handleUserSignup(req, res) {
  const { name, password, email, roles } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    roles,
  });

  const token = getJWTtoken(user);

  //   return res.render("home");
  setCookie(req, res, token);

  return res.status(201).json({
    message: "User created succesfully",
    id: user._id,
    // token,
  });
}

async function handleSignIn(req, res) {
  const { password, email } = req.body;

  const user = await User.findOne({ email, password });
  if (!user) {
    return res.status(404).json({ message: "Invalid email or password" });
  }

  const token = getJWTtoken(user);

  setCookie(req, res, token);
  return res.status(200).json({
    message: "Welcome back to the url shortener!",
    id: user._id,
    // token,
  });
}

async function handleSignOut(req, res) {
  // const token = req.headers.authorization.slice(7); // strip "Bearer "
  const token = req.cookies.token;

  await RevokedToken.create({
    token,
    expiresAt: new Date(req.user.exp * 1000),
  });

  res.clearCookie("token");
  return res.status(200).json({ message: "Signed out" });
}

async function verifyLoggedIn(req, res) {
  res.status(200).json({ id: req.user.id, roles: req.user.roles });
}

async function fnUpdateUserRoles(req, res) {
  const id = req.params.id;
  const roles = req.body.roles;

  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    { $set: { roles } },
    { new: true },
  );

  if (!updatedUser) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({
    id: updatedUser._id,
    roles: updatedUser.roles,
    message: "roles updated for the given user",
  });
}

async function fnDelteUser(req, res) {
  const id = req.params.id;

  const deleted = await User.findOneAndDelete({ _id: id });

  if (!deleted) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  return res.status(200).json({
    message: "User has been deleted",
  });
}

async function fnGetAllUsersExceptMe(req, res) {
  const users = await User.find(
    { _id: { $ne: req.user.id } },
    { password: 0 },
  );

  return res.status(200).json({
    data: users,
  });
}


module.exports = {
  handleUserSignup,
  handleSignIn,
  handleSignOut,
  verifyLoggedIn,
  fnUpdateUserRoles,
  fnDelteUser,
  fnGetAllUsersExceptMe
};
