const express = require('express');
const { handleUserSignup, handleSignIn } = require('../controllers/user');
const router = express.Router();

router.post("/sign_up", handleUserSignup);
router.post("/sign_in", handleSignIn);

module.exports = router;
