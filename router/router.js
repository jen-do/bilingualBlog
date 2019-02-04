const express = require("express"),
    router = express.Router();
const bcrypt = require("../bcrypt");
const db = require("../db");
const i18n = require("i18n");

/////////// home

router.get("/", (req, res) => {
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

    .post(async (req, res) => {
        try {
            const results = await db.login(req.body.email);
            if (results.length == 0) {
                throw new Error("no such email registered");
            } else {
                const matches = await bcrypt.compare(
                    req.body.pass,
                    results[0].pass
                );
                if (matches) {
                    req.session.userId = results[0].id;
                    req.session.editor = results[0].editor;
                    res.redirect("/edit/profile");
                } else {
                    throw new Error("passwords do not match");
                }
            }
        } catch (err) {
            console.log("error in POST /login:", err);
            res.render("login", {
                layout: "main",
                err: err
            });
        }
    });

////////// add + update project profile

router
    .route("/edit/profile")

    .get((req, res) => {
        res.render("editprofile", {
            layout: "main"
        });
    })

    .post(async (req, res) => {
        // checking the provided url if it contains http/https
        var httpUrlDe = "";
        var httpUrlEn = "";
        if (
            req.body.de_web !== "" &&
            !req.body.de_web.startsWith("http") &&
            !req.body.de_web.startsWith("https")
        ) {
            httpUrlDe = "http://" + req.body.de_web;
        } else {
            httpUrlDe = req.body.de_web;
        }

        if (
            req.body.en_web !== "" &&
            !req.body.en_web.startsWith("http") &&
            !req.body.en_web.startsWith("https")
        ) {
            httpUrlEn = "http://" + req.body.en_web;
        } else {
            httpUrlEn = req.body.en_web;
        }

        // storing project information in the database
        if (!req.file) {
            res.render("editprofile", {
                layout: "main",
                errimg: "please upload an image"
            });
        } else {
            try {
                var results = await db.saveProjectInfoGeneral(
                    req.body.contact,
                    "/" + req.file.filename,
                    req.session.userId
                );
                var projectId = results[0].id;
                var resultsDeEN = await Promise.all([
                    db.saveProjectInfoDe(
                        req.body.de_name,
                        req.body.de_short,
                        req.body.de_long,
                        req.body.de_contribute,
                        req.body.de_loc,
                        req.body.de_tags,
                        httpUrlDe,
                        projectId
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
                ]);

                res.render("projects", {
                    layout: "main",
                    successaddproject: true,
                    link: "/update/profile/" + projectId,
                    linkProjectSite: "/projects/" + projectId
                });
            } catch (err) {
                console.log("error in saving project information", err);
                res.render("editprofile", {
                    layout: "main",
                    err: err
                });
            }
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
                    res.render("ownprojects", {
                        layout: "main",
                        updateProjectEn: results[1]
                    });
                }
            })
            .catch(err => {
                console.log("error in GET /update/profile for re-edit", err);
            });
    });

router
    .route("/update/profile/:id")

    .get((req, res) => {
        Promise.all([
            db.getSingleProjectEn(req.params.id),
            db.getSingleProjectDe(req.params.id)
        ])
            .then(results => {
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

    .post(async (req, res) => {
        // again checking if the provided url starts with http/https
        var httpUrlDe = "";
        var httpUrlEn = "";

        if (
            req.body.de_web !== "" &&
            !req.body.de_web.startsWith("http") &&
            !req.body.de_web.startsWith("https")
        ) {
            httpUrlDe = "http://" + req.body.de_web;
        } else {
            httpUrlDe = req.body.de_web;
        }

        if (
            req.body.en_web !== "" &&
            !req.body.en_web.startsWith("http") &&
            !req.body.en_web.startsWith("https")
        ) {
            httpUrlEn = "http://" + req.body.en_web;
        } else {
            httpUrlEn = req.body.en_web;
        }

        // update profile information without image upload
        if (!req.file) {
            try {
                var results = await db.updateProjectInfoGeneralWithoutImg(
                    req.params.id,
                    req.body.contact
                );
                var resultsDeEn = await Promise.all([
                    db.updateProjectInfoDe(
                        req.body.de_name,
                        req.body.de_short,
                        req.body.de_long,
                        req.body.de_contribute,
                        req.body.de_loc,
                        req.body.de_tags,
                        httpUrlDe,
                        req.params.id
                    ),
                    db.updateProjectInfoEn(
                        req.body.en_name,
                        req.body.en_short,
                        req.body.en_long,
                        req.body.en_contribute,
                        req.body.en_loc,
                        req.body.en_tags,
                        httpUrlEn,
                        req.params.id
                    )
                ]);
                res.render("projects", {
                    layout: "main",
                    successupdate: true,
                    link: "/projects/" + req.params.id
                });
            } catch (err) {
                console.log("error in POST /edit/profile", err);
                res.render("updateprofile", {
                    layout: "main",
                    err: err
                });
            }
        }
        // update profile information incl. image upload
        else {
            try {
                var results = db.updateProjectInfoGeneral(
                    req.params.id,
                    req.body.contact,
                    "/" + req.file.filename
                );
                var resultsDeEn = await Promise.all([
                    db.updateProjectInfoDe(
                        req.body.de_name,
                        req.body.de_short,
                        req.body.de_long,
                        req.body.de_contribute,
                        req.body.de_loc,
                        req.body.de_tags,
                        httpUrlDe,
                        req.params.id
                    ),
                    db.updateProjectInfoEn(
                        req.body.en_name,
                        req.body.en_short,
                        req.body.en_long,
                        req.body.en_contribute,
                        req.body.en_loc,
                        req.body.en_tags,
                        httpUrlEn,
                        req.params.id
                    )
                ]);
                res.render("projects", {
                    layout: "main",
                    successupdate: true,
                    link: "/projects/" + req.params.id
                });
            } catch (err) {
                console.log("error in POST /update/profile", err);
                res.render("updateprofile", {
                    layout: "main",
                    err: err
                });
            }
        }
    });

////////// add + update posts

router
    .route("/edit/post")

    .get((req, res) => {
        res.render("editposts", {
            layout: "main",
            editor: req.session.editor
        });
    })

    .post((req, res) => {
        if (!req.file) {
            res.render("editposts", {
                layout: "main",
                errimg: "please upload an image"
            });
        } else {
            db.savePost("/" + req.file.filename, req.session.userId).then(
                results => {
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
                        .then(res.redirect("/blog"))
                        .catch(err => {
                            console.log("error in POST /edit/post", err);
                            res.render("editposts", {
                                layout: "main",
                                err: err
                            });
                        });
                }
            );
        }
    });

router
    .route("/update/post")

    .get((req, res) => {
        Promise.all([
            db.getPostsDeForReedit(req.session.userId),
            db.getPostsEnForReedit(req.session.userId)
        ])
            .then(results => {
                if (req.session.locale == "de") {
                    res.render("ownposts", {
                        layout: "main",
                        ownPostsDe: results[0]
                    });
                } else if (req.session.locale == "en") {
                    res.render("ownposts", {
                        layout: "main",
                        ownPostsEn: results[1]
                    });
                }
            })
            .catch(err => {
                console.log("error in GET /update/post for re-edit", err);
            });
    });

router
    .route("/update/post/:id")

    .get((req, res) => {
        Promise.all([
            db.getSinglePostEn(req.params.id),
            db.getSinglePostDe(req.params.id)
        ])
            .then(results => {
                res.render("updatepost", {
                    layout: "main",
                    singlePostEn: results[0],
                    singlePostDe: results[1]
                });
            })
            .catch(err => {
                console.log(err);
            });
    })

    .post(async (req, res) => {
        try {
            if (!req.file) {
                var results = await Promise.all([
                    db.updatePostDe(
                        req.body.de_title,
                        req.body.de_post,
                        req.body.de_tags,
                        req.params.id
                    ),
                    db.updatePostEn(
                        req.body.en_title,
                        req.body.en_post,
                        req.body.en_tags,
                        req.params.id
                    )
                ]);
                res.render("blog", {
                    layout: "main",
                    successupdatepost: true,
                    link: "/blog"
                });
            } else {
                var results = await db.updatePostImage(
                    req.params.id,
                    "/" + req.file.filename
                );
                var resultsDeEn = await await Promise.all([
                    db.updatePostDe(
                        req.body.de_title,
                        req.body.de_post,
                        req.body.de_tags,
                        req.params.id
                    ),
                    db.updatePostEn(
                        req.body.en_title,
                        req.body.en_post,
                        req.body.en_tags,
                        req.params.id
                    )
                ]);
                res.render("blog", {
                    layout: "main",
                    successupdatepost: true,
                    link: "/blog"
                });
            }
        } catch (err) {
            console.log("error in POST /update/post", err);
            res.render("updatepost", {
                layout: "main",
                err: err
            });
        }
    });

////////// blogs for projects + posts blogs

router
    .route("/projects")

    .get((req, res) => {
        if (req.session.locale == "en") {
            db.getProjectInfoEn().then(results => {
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
                    heading: "projekte",
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
                const postsEn = results;
                res.render("blog", {
                    layout: "main",
                    postsEn: postsEn
                });
            });
        } else if (req.session.locale == "de") {
            db.getPostsDe().then(results => {
                const postsDe = results;
                res.render("blog", {
                    layout: "main",
                    postsDe: postsDe
                });
            });
        }
    });

//////////// Links

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
