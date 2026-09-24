const express = require('express');
const urlRoute = require('./routes/url');
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
app.use("/url", urlRoute);
app.use("/", staticRoute);

app.listen(PORT, () => console.log(`server started at PORT: ${PORT}`));