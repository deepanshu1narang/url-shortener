const express = require("express");
const {
  handleUserSignup,
  handleSignIn,
  handleSignOut,
  verifyLoggedIn,
  fnUpdateUserRoles,
  fnDelteUser,
  fnGetAllUsersExceptMe,
} = require("../controllers/user");
const { requireAuthMiddleware, requireRoleMiddleware } = require("../middlewares/user");
const router = express.Router();

router.route("/sign_up")
    .post(handleUserSignup);

router.route("/sign_in")
    .post(handleSignIn);

router.route("/sign_out")
    .post(requireAuthMiddleware, handleSignOut);

router.route("/me")
    .get(requireAuthMiddleware, verifyLoggedIn);

router.route("/all_users")
    .get(requireAuthMiddleware, requireRoleMiddleware("admin", "super_admin"), fnGetAllUsersExceptMe);

router.route("/update/:id")
    .patch(requireAuthMiddleware, requireRoleMiddleware("super_admin"), fnUpdateUserRoles);

router.route("/delete/:id")
    .delete(requireAuthMiddleware, requireRoleMiddleware("super_admin"), fnDelteUser);

module.exports = router;
