const express = require("express");
const {
  handleUserSignup,
  handleSignIn,
  handleSignOut,
} = require("../controllers/user");
const { requireAuthMiddleware } = require("../middlewares/user");
const router = express.Router();

router.route("/sign_up")
    .post(handleUserSignup);
router.route("/sign_in")
    .post(handleSignIn);
router.route("/sign_out")
    .post(requireAuthMiddleware, handleSignOut);

module.exports = router;
