const shortid = require('shortid');
const URL = require("../models/url");

const STATUSES = {
    success: "SUCCESS",
    "failure": "FAILURE",
    pending: "PENDING"
}

async function fnGenerateNewShortUrl(req, res) {
    const body = req.body;
    if (!body || !body.url) {
        return res.status(400).json({
            status: STATUSES.failure,
            error: "Please give a valid url",
            missing_properties: ["url"]
        });
    }

    const shortId = shortid();

    await URL.create({
        shortId,
        redirectUrl: body.url,
        visitHistory: []
    })

    return res.status(201).json({
        status: STATUSES.success,
        id: shortId
    });
}

async function fnRedirectToOriginalUrl(req, res) {
    const shortId = req.params.shortId;

    if (!shortId)
        return res.status(400).json({
            status: STATUSES.failure,
            error: "Not found",
        });

    const entry = await URL.findOneAndUpdate({
        shortId
    }, {
        $push: {
            visitHistory: { timestamp: Date.now() }
        }
    });

    res.redirect(entry.redirectUrl);

}

async function fnGetAnalytics(req, res) {
    const shortId = req.params.shortId;

    const result = await URL.findOne({ shortId });
    return res.status(200).json({
        totalClicks: result.visitHistory.length,
        analytics: result.visitHistory
    });
}

module.exports = { fnGenerateNewShortUrl, fnRedirectToOriginalUrl, fnGetAnalytics };