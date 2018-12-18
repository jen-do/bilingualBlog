const express = require("express");
const app = express();
const router = require("./router/router");
// const db = require("./db");
// const bcrypt = require("./bcrypt");
const i18n = require("i18n");

i18n.configure({
    locales: ["en", "de"],
    defaultLocale: "en",
    // queryParameter: "lang",
    directory: "" + __dirname + "/locales"
});

app.use(i18n.init);

// handlebars
var hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// handlebars end

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

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/uploads"));

app.use(router);

app.listen(8080, () => console.log("Listening..."));
