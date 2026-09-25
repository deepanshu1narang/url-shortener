const express = require('express');
const { handleUserSignup, handleSignIn, handleSignOut } = require('../controllers/user');
const { requireAuthMiddleware } = require('../middlewares/user');
const router = express.Router();

router.post("/sign_up", handleUserSignup);
router.post("/sign_in", handleSignIn);
router.post("/sign_out", requireAuthMiddleware, handleSignOut);

module.exports = router;
