//////// SERVER SETUP, MODULES, ROUTER, MIDDLEWARE

const express = require("express");
const app = express();
const router = require("./router/router");

// handlebars
var hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// i18n for internationalisation / language switching
const i18n = require("i18n");
i18n.configure({
    locales: ["en", "de"],
    defaultLocale: "en",
    directory: "" + __dirname + "/locales"
});
app.use(i18n.init);

// modules for image upload
var multer = require("multer");
var uidSafe = require("uid-safe");
var path = require("path");

var diskStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function(req, file, callback) {
        uidSafe(24).then(function(uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    }
});

var uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152
    }
});

// cookie session, bodyparser, csurf
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const csurf = require("csurf");

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

app.use("/edit/post", uploader.single("file"));
app.use("/edit/profile", uploader.single("file"));
app.use("/update/post/:id", uploader.single("file"));
app.use("/update/profile/:id", uploader.single("file"));

app.use(csurf());

app.use(function(req, res, next) {
    if (req.session.locale) {
        req.setLocale(req.session.locale);
    }
    next();
});

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(function(req, res, next) {
    if (!req.session.userId && req.url == "/edit/profile") {
        res.redirect("/login");
    } else if (!req.session.userId && req.url == "/edit/post") {
        res.redirect("/login");
    } else {
        next();
    }
});

app.use((req, res, next) => {
    if (req.session.userId) {
        res.locals.loggedIn = true;
    } else {
        res.locals.loggedIn = false;
    }
    next();
});

app.use((req, res, next) => {
    if (req.session.editor) {
        res.locals.editor = true;
    } else {
        res.locals.editor = false;
    }
    next();
});

app.use(router);

// serving static files
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/uploads"));

app.listen(8080, () => console.log("Listening..."));
