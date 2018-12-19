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
            layout: "loggedin",
            editor: req.session.editor
        });
    })

    .post((req, res) => {
        console.log(
            "req.body in POST /edit/profile ",
            req.body,
            "req.file in POST /edit/profile ",
            req.file
        );

        db.saveProjectInfoGeneral(
            req.body.contact,
            "/" + req.file.filename,
            req.session.userId
        )
            .then(results => {
                console.log("results in db.saveProjectInfoGeneral", results);
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
                        res.render("editprofile", {
                            layout: "loggedin",
                            err: err
                        });
                    });
            })
            .catch(err => {
                console.log("error in db.saveProjectInfoGeneral", err);
                res.render("editprofile", {
                    layout: "loggedin",
                    err: err
                });
            });
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
                        layout: "loggedin",
                        updateProjectDe: results[0],
                        editor: req.session.editor
                    });
                } else if (req.session.locale == "en") {
                    console.log(results[1]);
                    res.render("ownprojects", {
                        layout: "loggedin",
                        updateProjectEn: results[1],
                        editor: req.session.editor
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
                    layout: "loggedin",
                    editor: req.session.editor,
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
                Promise.all([
                    db.updateProjectInfoDe(
                        req.body.de_name,
                        req.body.de_short,
                        req.body.de_long,
                        req.body.de_contribute,
                        req.body.de_tags,
                        req.body.de_web,
                        req.params.id
                    ),
                    db.updateProjectInfoEn(
                        req.body.en_name,
                        req.body.en_short,
                        req.body.en_long,
                        req.body.en_contribute,
                        req.body.en_tags,
                        req.body.en_web,
                        req.params.id
                    )
                ])
                    .then(results => {
                        console.log(
                            "results in db.updateProjectInfoDe/en",
                            results
                        );
                        res.render("updateprofile", {
                            editor: req.session.editor,
                            singleProjectEn: results[0],
                            singleProjectDe: results[1]
                        });
                    })
                    .catch(err => {
                        console.log("error in POST /edit/profile", err);
                        res.render("updateprofile", {
                            layout: "loggedin",
                            err: err
                        });
                    });
            })
            .catch(err => {
                console.log("error in db.saveProjectInfoGeneral", err);
                res.render("editprofile", {
                    layout: "loggedin",
                    err: err
                });
            });
    });

router
    .route("/edit/post")

    .get((req, res) => {
        res.render("editposts", {
            layout: "loggedin",
            editor: req.session.editor
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
                res.render("editposts", {
                    layout: "loggedin",
                    err: err
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
        // req.params.lang = req.session.locale;
        if (req.session.locale == "en") {
            db.getPostsEn().then(results => {
                // console.log(results);
                const postsEn = results;
                res.render("blog", {
                    layout: "main",
                    postsEn: postsEn
                });
            });
        } else if (req.session.locale == "de") {
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
