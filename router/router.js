const express = require("express"),
    router = express.Router();
const bcrypt = require("../bcrypt");
const db = require("../db");

/////////// home

router.get("/", (req, res) => {
    console.log("locales:", res.locals.locale, res.locals.getLocales);
    res.render("about", {
        layout: "main"
    });
});

////////// login + registration + logout

router
    .route("/register")

    .get((req, res) => {
        res.render("register", {
            layout: "main"
        });
    })

    .post((req, res) => {
        console.log(req.body);
        bcrypt.hash(req.body.pass).then(hash => {
            db.register(req.body.username, req.body.email, hash)
                .then(results => {
                    req.session.userId = results[0].id;
                    req.session.editor = results[0].editor;
                    res.redirect("/edit/profile");
                })
                .catch(err => {
                    console.log("error in POST register: ", err);
                    res.render("register", {
                        layout: "main",
                        err: err
                    });
                });
        });
    });

router
    .route("/login")

    .get((req, res) => {
        res.render("login", {
            layout: "main"
        });
    })

    .post((req, res) => {
        db.login(req.body.email)
            .then(results => {
                console.log("results 1", results);
                if (results.length == 0) {
                    throw new Error("no such email registered");
                }
                bcrypt
                    .compare(req.body.pass, results[0].pass)
                    .then(matches => {
                        if (matches) {
                            console.log("passwords do match");
                            req.session.userId = results[0].id;
                            req.session.editor = results[0].editor;
                            console.log(
                                "sessioncookie login",
                                req.session.userId
                            );
                            res.redirect("/edit/profile");
                        } else {
                            throw new Error("passwords do not match");
                        }
                    })
                    .catch(err => {
                        console.log("error in POST /login: ", err);
                        res.render("login", {
                            layout: "main",
                            err: err
                        });
                    });
            })
            .catch(err => {
                console.log("error in POST /login: ", err);
                res.render("login", {
                    layout: "main",
                    err: err
                });
            });
    });

router
    .route("/logout")

    .get((req, res) => {
        req.session = null;
        res.redirect("/");
    });

////////// edit projects profile + posts

router
    .route("/edit/profile")

    .get((req, res) => {
        res.render("editprofile", {
            layout: "main",
            editor: req.session.editor
        });
    })

    .post((req, res) => {
        console.log("req.body in POST /edit/profile ", req.body);
        db.saveProjectInfoGeneral(req.body.contact, req.session.userId)
            .then(results => {
                // console.log("results in db.saveProjectInfoGeneral", results);
                Promise.all([
                    db.saveProjectInfoDe(
                        req.body.de_name,
                        req.body.de_short,
                        req.body.de_long,
                        req.body.de_contribute,
                        req.body.de_tags,
                        req.body.de_web,
                        results[0].id
                    ),
                    db.saveProjectInfoEn(
                        req.body.en_name,
                        req.body.en_short,
                        req.body.en_long,
                        req.body.en_contribute,
                        req.body.en_tags,
                        req.body.en_web,
                        results[0].id
                    )
                ])
                    .then(results => {
                        console.log(
                            "results in db.saveProjectInfoDe/en",
                            results
                        );
                        res.redirect("/");
                    })
                    .catch(err => {
                        console.log("error in POST /edit/profile", err);
                    });
            })
            .catch(err => {
                console.log("error in db.saveProjectInfoGeneral", err);
            });
    });

router
    .route("/edit/post")

    .get((req, res) => {
        res.render("editposts", {
            layout: "main"
        });
    })

    .post((req, res) => {
        Promise.all([
            db.savePostDe(
                req.body.de_title,
                req.body.de_post,
                req.body.de_tags,
                req.body.de_url
            ),
            db.savePostEn(
                req.body.en_title,
                req.body.en_post,
                req.body.en_tags,
                req.body.en_url
            )
        ])
            .then(results => {
                console.log("results in POST /edit/post", results);
                res.redirect("/");
            })
            .catch(err => {
                console.log("error in POST /edit/post", err);
            });
    });

////////// projects + posts blogs

router
    .route("/:lang/projects")

    .get((req, res) => {
        console.log("locales", res.locals.locale);
        if (req.params.lang == "en") {
            db.getProjectInfoEn().then(results => {
                // console.log(results);
                const projectsEn = results;
                res.render("projects", {
                    layout: "main",
                    heading: "projects",
                    projectsEn: projectsEn
                });
            });
        } else if (req.params.lang == "de") {
            db.getProjectInfoDe().then(results => {
                // console.log(results);
                const projectsDe = results;
                res.render("projects", {
                    layout: "main",
                    heading: "Projekte",
                    projectsDe: projectsDe
                });
            });
        } else {
            return;
        }
    });

router
    .route("/:lang/blog")

    .get((req, res) => {
        if (req.params.lang == "en") {
            db.getPostsEn().then(results => {
                // console.log(results);
                const postsEn = results;
                res.render("blog", {
                    layout: "main",
                    postsEn: postsEn
                });
            });
        } else if (req.params.lang == "de") {
            db.getPostsDe().then(results => {
                // console.log(results);
                const postsDe = results;
                res.render("blog", {
                    layout: "main",
                    postsDe: postsDe
                });
            });
        }
    });

module.exports = router;
