// Node has no build step to auto-inject .env like Vite/CRA/Metro do — this reads
// .env and writes each KEY=VALUE onto process.env. Must run first, before any
// other file (e.g. controllers reading process.env.JWT_SECRET) is required.
require('dotenv').config();
const express = require('express');
const urlRoute = require('./routes/url');
const userRoute = require('./routes/user');
const staticRoute = require('./routes/staticRouter');
const { connectMongoDB } = require('./connection');
const path = require('node:path');
const { PORT } = require('./constants');

const app = express();

// connection
connectMongoDB("mongodb://localhost:27017/short-url")
    .then(() => console.log("Mongo DB running"));

app.set('view engine', 'ejs');
app.set('views', path.resolve('./view'));

// schema - done and used in controllers
// middlewares
app.use(express.urlencoded({ extended: false })); // parses form-encoded bodies (e.g. HTML <form> submits) into req.body
app.use(express.json({ extended: false })); // parses JSON request bodies (e.g. Postman/fetch with Content-Type: application/json) into req.body


// app.get("/ssr/url", async (req, res) => {
//     const allUrls = await URL.find({});

//     return res.render('home', {
//             urls: allUrls,
//             port: PORT
//         });
//     });

// routes
// url
app.use("/url", urlRoute);
app.use("/", staticRoute);

// user
app.use(userRoute);

app.listen(PORT, () => console.log(`server started at PORT: ${PORT}`));
