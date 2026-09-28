const express = require("express");
const {
  fnGenerateNewShortUrl,
  fnRedirectToOriginalUrl,
  fnGetAnalytics,
  fnFindMyUrls,
  fnGetAllUrls,
  fnDeleteUrl,
} = require("../controllers/url");
const { requireAuthMiddleware, requireRoleMiddleware } = require("../middlewares/user");

const router = express.Router();

router.route("/")
    .post(requireAuthMiddleware, requireRoleMiddleware("user", "premium_user", "admin"), fnGenerateNewShortUrl);

router.route("/analytics/:shortId")
    .get(requireAuthMiddleware, requireRoleMiddleware("analyst", "admin", "premium_user"), fnGetAnalytics);

router.route("/my_urls")
    .get(requireAuthMiddleware, requireRoleMiddleware("user", "premium_user", "admin"), fnFindMyUrls);

router.route("/all_urls")
    .get(requireAuthMiddleware, requireRoleMiddleware("analyst", "admin"), fnGetAllUrls);

router.route("/delete/:shortId")
    .delete(requireAuthMiddleware, requireRoleMiddleware("super_admin"), fnDeleteUrl);

router.route("/:shortId")
    .get(fnRedirectToOriginalUrl);

module.exports = router;
