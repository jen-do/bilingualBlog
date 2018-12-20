const express = require("express"),
    router = express.Router();
const bcrypt = require("../bcrypt");
const db = require("../db");
const i18n = require("i18n");

/////////// home

router.get("/", (req, res) => {
    // i18n.getLocale();
    req.session.locale = res.locals.locale;
    res.render("about", {
        layout: "main"
    });
});

/////////// change language

router.get("/lang", (req, res) => {
    if (req.session.locale == "en") {
        req.session.locale = "de";
        i18n.setLocale(res.locals, "de");
        var prevUrl = req.header("Referer");
        return res.redirect(prevUrl);
    }
    if (req.session.locale == "de") {
        req.session.locale = "en";
        i18n.setLocale(res.locals, "en");
        var backUrl = req.header("Referer");
        res.redirect(backUrl);
    }
});

/////////// register + login

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

////////// edit projects profile + posts

router
    .route("/edit/profile")

    .get((req, res) => {
        console.log("req.session", req.session.userId);
        res.render("editprofile", {
            layout: "main"
        });
    })

    .post((req, res) => {
        if (!req.file) {
            res.render("editprofile", {
                layout: "main",
                errimg: "please upload an image"
            });
        }
        if (!req.body.contact) {
            res.render("editprofile", {
                layout: "main",
                erremail: "no email"
            });
        } else {
            db.saveProjectInfoGeneral(
                req.body.contact,
                "/" + req.file.filename,
                req.session.userId
            )
                .then(results => {
                    var projectId = results[0].id;
                    var httpUrlDe = "";
                    var httpUrlEn = "";

                    if (
                        req.body.de_web !== "" &&
                        !req.body.de_web.startsWith("http") &&
                        !req.body.de_web.startsWith("https")
                    ) {
                        httpUrlDe = "http://" + req.body.de_web;
                        console.log("no http");
                    } else {
                        httpUrlDe = req.body.de_web;
                        console.log("http");
                    }

                    if (
                        req.body.en_web !== "" &&
                        !req.body.en_web.startsWith("http") &&
                        !req.body.en_web.startsWith("https")
                    ) {
                        httpUrlEn = "http://" + req.body.en_web;
                        console.log("no http");
                    } else {
                        httpUrlEn = req.body.en_web;
                        console.log("http");
                    }

                    Promise.all([
                        db.saveProjectInfoDe(
                            req.body.de_name,
                            req.body.de_short,
                            req.body.de_long,
                            req.body.de_contribute,
                            req.body.de_loc,
                            req.body.de_tags,
                            httpUrlDe,
                            results[0].id
                        ),
                        db.saveProjectInfoEn(
                            req.body.en_name,
                            req.body.en_short,
                            req.body.en_long,
                            req.body.en_contribute,
                            req.body.en_loc,
                            req.body.en_tags,
                            httpUrlEn,
                            results[0].id
                        )
                    ])
                        .then(results => {
                            console.log(results);
                            res.render("projects", {
                                layout: "main",
                                successaddproject: true,
                                link: "/update/profile/" + projectId
                            });
                        })
                        .catch(err => {
                            console.log("error in POST /edit/profile", err);
                            res.render("editprofile", {
                                layout: "main",
                                err: err
                            });
                        });
                })
                .catch(err => {
                    console.log("error in db.saveProjectInfoGeneral", err);
                    res.render("editprofile", {
                        layout: "main",
                        err: err
                    });
                });
        }
    });

router
    .route("/update/profile")

    .get((req, res) => {
        Promise.all([
            db.getProjectDeForReedit(req.session.userId),
            db.getProjectEnForReedit(req.session.userId)
        ])
            .then(results => {
                if (req.session.locale == "de") {
                    res.render("ownprojects", {
                        layout: "main",
                        updateProjectDe: results[0]
                    });
                } else if (req.session.locale == "en") {
                    console.log(results[1]);
                    res.render("ownprojects", {
                        layout: "main",
                        updateProjectEn: results[1]
                    });
                }
            })
            .catch(err => {
                console.log("error in reedit profile", err);
            });
    });

router
    .route("/update/profile/:id")

    .get((req, res) => {
        console.log(req.params.id);
        Promise.all([
            db.getSingleProjectEn(req.params.id),
            db.getSingleProjectDe(req.params.id)
        ])
            .then(results => {
                console.log("results in /update/profile/:id", results);
                res.render("updateprofile", {
                    layout: "main",
                    singleProjectEn: results[0],
                    singleProjectDe: results[1]
                });
            })
            .catch(err => {
                console.log(err);
            });
    })

    .post((req, res) => {
        db.updateProjectInfoGeneral(
            req.params.id,
            req.body.contact,
            "/" + req.file.filename
        )
            .then(results => {
                console.log("results in db.updateProjectInfoGeneral", results);

                var httpUrlDe = "";
                var httpUrlEn = "";

                if (
                    req.body.de_web !== "" &&
                    !req.body.de_web.startsWith("http") &&
                    !req.body.de_web.startsWith("https")
                ) {
                    httpUrlDe = "http://" + req.body.de_web;
                    console.log("no http");
                } else {
                    httpUrlDe = req.body.de_web;
                    console.log("http");
                }

                if (
                    req.body.en_web !== "" &&
                    !req.body.en_web.startsWith("http") &&
                    !req.body.en_web.startsWith("https")
                ) {
                    httpUrlEn = "http://" + req.body.en_web;
                    console.log("no http");
                } else {
                    httpUrlEn = req.body.en_web;
                    console.log("http");
                }

                Promise.all([
                    db.updateProjectInfoDe(
                        req.body.de_name,
                        req.body.de_short,
                        req.body.de_long,
                        req.body.de_contribute,
                        req.body.de_tags,
                        httpUrlDe,
                        // req.body.de_web,
                        req.params.id
                    ),
                    db.updateProjectInfoEn(
                        req.body.en_name,
                        req.body.en_short,
                        req.body.en_long,
                        req.body.en_contribute,
                        req.body.en_tags,
                        httpUrlEn,
                        // req.body.en_web,
                        req.params.id
                    )
                ])
                    .then(results => {
                        console.log(
                            "results in db.updateProjectInfoDe/en",
                            results
                        );
                        // res.redirect("/update/profile/" + req.params.id);
                        res.render("projects", {
                            layout: "main",
                            successupdate: true,
                            link: "/projects/" + req.params.id
                        });
                    })
                    .catch(err => {
                        console.log("error in POST /edit/profile", err);
                        res.render("updateprofile", {
                            layout: "main",
                            err: err
                        });
                    });
            })
            .catch(err => {
                console.log("error in db.saveProjectInfoGeneral", err);
                res.render("editprofile", {
                    layout: "main",
                    err: err
                });
            });
    });

router
    .route("/edit/post")

    .get((req, res) => {
        res.render("editposts", {
            layout: "main",
            editor: req.session.editor
        });
    })

    .post((req, res) => {
        db.savePost("/" + req.file.filename).then(results => {
            console.log(results);
            Promise.all([
                db.savePostDe(
                    req.body.de_title,
                    req.body.de_post,
                    req.body.de_tags,
                    results[0].id
                ),
                db.savePostEn(
                    req.body.en_title,
                    req.body.en_post,
                    req.body.en_tags,
                    results[0].id
                )
            ])
                .then(results => {
                    console.log("results in POST /edit/post", results);
                    res.redirect("/blog");
                })
                .catch(err => {
                    console.log("error in POST /edit/post", err);
                    res.render("editposts", {
                        layout: "main",
                        err: err
                    });
                });
        });
    });

////////// projects + posts blogs + links

router
    .route("/projects")

    .get((req, res) => {
        // console.log("locales", res.locals.locale);
        // req.params.lang = req.session.locale;
        if (req.session.locale == "en") {
            db.getProjectInfoEn().then(results => {
                console.log(results);
                const projectsEn = results;
                res.render("projects", {
                    layout: "main",
                    heading: "projects",
                    projectsEn: projectsEn
                });
            });
        } else if (req.session.locale == "de") {
            db.getProjectInfoDe().then(results => {
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
    .route("/projects/:id")

    .get((req, res) => {
        console.log(req.params.id);
        if (req.session.locale == "en") {
            db.getSingleProjectEn(req.params.id).then(results => {
                const singleProjectEn = results;
                res.render("projects", {
                    layout: "main",
                    singleProjectEn: singleProjectEn
                });
            });
        } else if (req.session.locale == "de") {
            db.getSingleProjectDe(req.params.id).then(results => {
                const singleProjectDe = results;
                res.render("projects", {
                    layout: "main",
                    singleProjectDe: singleProjectDe
                });
            });
        }
    });

router
    .route("/blog")

    .get((req, res) => {
        if (req.session.locale == "en") {
            db.getPostsEn().then(results => {
                console.log(results);
                const postsEn = results;
                res.render("blog", {
                    layout: "main",
                    postsEn: postsEn
                });
            });
        } else if (req.session.locale == "de") {
            db.getPostsDe().then(results => {
                console.log(results);
                const postsDe = results;
                res.render("blog", {
                    layout: "main",
                    postsDe: postsDe
                });
            });
        }
    });

router
    .route("/links")

    .get((req, res) => {
        res.render("links", {
            layout: "main"
        });
    });

//////////// Logout

router
    .route("/logout")

    .get((req, res) => {
        req.session = null;
        res.redirect("/");
    });

module.exports = router;
