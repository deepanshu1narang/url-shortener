const express = require('express');
const { PORT } = require('../constants');
const URL = require('../models/url');

const router = express.Router();

router.get("/", async (req, res) => {
    const allUrls = await URL.find({});

    const urlsWithLink = allUrls.map(u => ({
        ...u.toObject(),
        fullUrl: `http://localhost:${PORT}/url/${u.shortId}`
    }));

    res.render('home', {
        urls: allUrls,
        // urlsWithLink
        port: PORT
    });
});

module.exports = router;