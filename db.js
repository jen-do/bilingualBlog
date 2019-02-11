const spicedPg = require("spiced-pg");

var db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:postgres:postgres@localhost:5432/finalproject`
);

exports.register = (username, email, pass) => {
    return db
        .query(
            `
            INSERT INTO users (username, email, pass)
            VALUES ($1, $2, $3)
            RETURNING id, username, editor
            `,
            [username || null, email || null, pass || null]
        )
        .then(results => {
            return results.rows;
        });
};

exports.login = email => {
    return db
        .query(
            `
            SELECT *
            FROM users
            WHERE email = $1`,
            [email]
        )
        .then(results => {
            return results.rows;
        });
};

exports.saveProjectInfoGeneral = (email, image, user_id) => {
    return db
        .query(
            `
            INSERT INTO projects (email, image, user_id)
            VALUES ($1, $2, $3)
            RETURNING id, email, image
            `,
            [email, image, user_id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.saveProjectInfoDe = (
    name,
    short,
    long,
    contribute,
    loc,
    tags,
    url,
    projects_id
) => {
    return db
        .query(
            `
            INSERT INTO projects_de (de_name, de_short, de_long, de_contribute, de_loc, de_tags, de_web, projects_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING de_name, de_short, de_long, de_contribute, de_loc, de_tags, de_web
            `,
            [name, short, long, contribute, loc, tags, url, projects_id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.saveProjectInfoEn = (
    name,
    short,
    long,
    contribute,
    loc,
    tags,
    url,
    projects_id
) => {
    return db
        .query(
            `
            INSERT INTO projects_en (en_name, en_short, en_long, en_contribute, en_loc, en_tags, en_web, projects_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING en_name, en_short, en_long, en_contribute, en_loc, en_tags, en_web
            `,
            [name, short, long, contribute, loc, tags, url, projects_id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.getProjectInfoEn = () => {
    return db
        .query(
            `
            SELECT projects.id, projects.email, projects.image, projects_en.en_name, projects_en.en_short, projects_en.en_long, projects_en.en_contribute, projects_en.en_loc, projects_en.en_tags, projects_en.en_web FROM projects
            LEFT JOIN projects_en
            ON projects.id = projects_id
            ORDER BY projects.id DESC
            `
        )
        .then(results => {
            return results.rows;
        });
};

exports.getProjectInfoDe = () => {
    return db
        .query(
            `
            SELECT projects.id, projects.email, projects.image, projects_de.de_name, projects_de.de_short, projects_de.de_long, projects_de.de_contribute, projects_de.de_loc, projects_de.de_tags, projects_de.de_web FROM projects
            LEFT JOIN projects_de
            ON projects.id = projects_id
            ORDER BY projects.id DESC
        `
        )
        .then(results => {
            return results.rows;
        });
};

exports.getSingleProjectEn = id => {
    return db
        .query(
            `
            SELECT projects.id, projects.email, projects.image, projects_en.en_name, projects_en.en_short, projects_en.en_long, projects_en.en_contribute, projects_en.en_loc, projects_en.en_tags, projects_en.en_web FROM projects
            LEFT JOIN projects_en
            ON projects.id = projects_id
            WHERE projects.id = $1
        `,
            [id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.getSingleProjectDe = id => {
    return db
        .query(
            `
            SELECT projects.id, projects.email, projects.image, projects_de.de_name, projects_de.de_short, projects_de.de_long, projects_de.de_contribute, projects_de.de_loc, projects_de.de_tags, projects_de.de_web FROM projects
            LEFT JOIN projects_de
            ON projects.id = projects_id
            WHERE projects.id = $1
        `,
            [id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.getProjectDeForReedit = userid => {
    return db
        .query(
            `
            SELECT projects.id, projects.email, projects.image, projects_de.de_name, projects_de.de_short, projects_de.de_long, projects_de.de_contribute, projects_de.de_loc, projects_de.de_tags, projects_de.de_web FROM projects
            LEFT JOIN projects_de
            ON projects.id = projects_id
            WHERE user_id = $1
            `,
            [userid]
        )
        .then(results => {
            return results.rows;
        });
};

exports.getProjectEnForReedit = userid => {
    return db
        .query(
            `
            SELECT projects.id, projects.email, projects.image, projects_en.en_name, projects_en.en_short, projects_en.en_long, projects_en.en_contribute, projects_en.en_loc, projects_en.en_tags, projects_en.en_web FROM projects
            LEFT JOIN projects_en
            ON projects.id = projects_id
            WHERE user_id = $1
            `,
            [userid]
        )
        .then(results => {
            return results.rows;
        });
};

exports.updateProjectInfoGeneral = (id, email, image) => {
    return db
        .query(
            `
            UPDATE projects
            SET email = $2, image = $3
            WHERE id = $1
            RETURNING id, email, image
            `,
            [id, email, image]
        )
        .then(results => {
            return results.rows;
        });
};

exports.updateProjectInfoGeneralWithoutImg = (id, email) => {
    return db
        .query(
            `
            UPDATE projects
            SET email = $2
            WHERE id = $1
            RETURNING id, email, image
            `,
            [id, email]
        )
        .then(results => {
            return results.rows;
        });
};

exports.updateProjectInfoDe = (
    name,
    short,
    long,
    contribute,
    loc,
    tags,
    web,
    id
) => {
    return db
        .query(
            `
            UPDATE projects_de
            SET de_name = $1, de_short = $2, de_long = $3, de_contribute = $4, de_loc = $5, de_tags = $6, de_web = $7
            WHERE projects_id = $8
            `,
            [name, short, long, contribute, loc, tags, web, id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.updateProjectInfoEn = (
    name,
    short,
    long,
    contribute,
    loc,
    tags,
    web,
    id
) => {
    return db
        .query(
            `
            UPDATE projects_en
            SET en_name = $1, en_short = $2, en_long = $3, en_contribute = $4, en_loc = $5, en_tags = $6, en_web = $7
            WHERE projects_id = $8
            `,
            [name, short, long, contribute, loc, tags, web, id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.savePost = (image, userid) => {
    return db
        .query(
            `
            INSERT INTO posts (image, user_id)
            VALUES ($1, $2)
            RETURNING image, id
            `,
            [image || null, userid]
        )
        .then(results => {
            return results.rows;
        });
};

exports.savePostDe = (title, post, tags, post_id) => {
    return db
        .query(
            `
            INSERT INTO posts_de (de_title, de_post, de_tags, post_id)
            VALUES ($1, $2, $3, $4)
            RETURNING de_title, de_post, de_tags
            `,
            [title, post, tags, post_id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.savePostEn = (title, post, tags, post_id) => {
    return db
        .query(
            `
            INSERT INTO posts_en (en_title, en_post, en_tags, post_id)
            VALUES ($1, $2, $3, $4)
            RETURNING en_title, en_post, en_tags
            `,
            [title, post, tags, post_id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.getPostsDe = () => {
    return db
        .query(
            `
            SELECT posts.id, posts.image, posts_de.de_title, posts_de.de_post, posts_de.de_tags
            FROM posts
            LEFT JOIN posts_de
            ON posts.id = posts_de.post_id
            ORDER BY id DESC
            `
        )
        .then(results => {
            return results.rows;
        });
};

exports.getPostsEn = () => {
    return db
        .query(
            `
            SELECT posts.id, posts.image, posts_en.en_title, posts_en.en_post, posts_en.en_tags
            FROM posts
            LEFT JOIN posts_en
            ON posts.id = posts_en.post_id
            ORDER BY id DESC
            `
        )
        .then(results => {
            return results.rows;
        });
};

exports.getPostsDeForReedit = userid => {
    return db
        .query(
            `
            SELECT posts.id, posts.image, posts_de.de_title, posts_de.de_post, posts_de.de_tags
            FROM posts
            LEFT JOIN posts_de
            ON posts.id = post_id
            WHERE posts.user_id = $1
            `,
            [userid]
        )
        .then(results => {
            return results.rows;
        });
};

exports.getPostsEnForReedit = userid => {
    return db
        .query(
            `
            SELECT posts.id, posts.image, posts_en.en_title, posts_en.en_post, posts_en.en_tags
            FROM posts
            LEFT JOIN posts_en
            ON posts.id = post_id
            WHERE posts.user_id = $1
            `,
            [userid]
        )
        .then(results => {
            return results.rows;
        });
};

exports.getSinglePostEn = id => {
    return db
        .query(
            `
            SELECT posts.image, posts_en.en_title, posts_en.en_post, posts_en.en_tags
            FROM posts
            LEFT JOIN posts_en
            ON posts.id = post_id
            WHERE posts.id = $1
            `,
            [id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.getSinglePostDe = id => {
    return db
        .query(
            `
            SELECT posts.image, posts_de.de_title, posts_de.de_post, posts_de.de_tags
            FROM posts
            LEFT JOIN posts_de
            ON posts.id = post_id
            WHERE posts.id = $1
            `,
            [id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.updatePostImage = (id, image) => {
    return db
        .query(
            `
            UPDATE posts
            SET image = $2
            WHERE id = $1
            `,
            [id, image]
        )
        .then(results => {
            return results.rows;
        });
};

exports.updatePostDe = (title, post, tags, id) => {
    return db
        .query(
            `
            UPDATE posts_de
            SET de_title = $1, de_post = $2, de_tags= $3
            WHERE post_id = $4
            `,
            [title, post, tags, id]
        )
        .then(results => {
            return results.rows;
        });
};

exports.updatePostEn = (title, post, tags, id) => {
    return db
        .query(
            `
            UPDATE posts_en
            SET en_title = $1, en_post = $2, en_tags= $3
            WHERE post_id = $4
            `,
            [title, post, tags, id]
        )
        .then(results => {
            return results.rows;
        });
};
