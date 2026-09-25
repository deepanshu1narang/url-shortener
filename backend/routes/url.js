const express = require("express");
const {
  fnGenerateNewShortUrl,
  fnRedirectToOriginalUrl,
  fnGetAnalytics,
  fnFindMyUrls,
} = require("../controllers/url");
const { requireAuthMiddleware } = require("../middlewares/user");

const router = express.Router();

router.route("/")
    .post(requireAuthMiddleware, fnGenerateNewShortUrl);

router.route("/analytics/:shortId")
    .get(requireAuthMiddleware, fnGetAnalytics);

router.route("/my_urls")
    .get(requireAuthMiddleware, fnFindMyUrls);

router.route("/:shortId")
    .get(fnRedirectToOriginalUrl);

module.exports = router;
