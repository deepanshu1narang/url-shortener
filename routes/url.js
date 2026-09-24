const express = require('express');
const { fnGenerateNewShortUrl, fnRedirectToOriginalUrl, fnGetAnalytics } = require('../controllers/url');

const router = express.Router();

router.route("/")
    .post(fnGenerateNewShortUrl);

router.route("/:shortId")
    .get(fnRedirectToOriginalUrl);

router.route("/analytics/:shortId")
    .get(fnGetAnalytics);

module.exports = router;