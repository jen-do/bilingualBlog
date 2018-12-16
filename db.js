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
            console.log(results);
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

exports.saveProjectInfoGeneral = (email, user_id) => {
    return db
        .query(
            `
        INSERT INTO projects (email, user_id)
        VALUES ($1, $2)
        RETURNING id, email
        `,
            [email, user_id]
        )
        .then(results => {
            console.log(results);
            return results.rows;
        });
};

exports.saveProjectInfoDe = (
    name,
    short,
    long,
    contribute,
    tags,
    url,
    projects_id
) => {
    return db
        .query(
            `
        INSERT INTO projects_de (de_name, de_short, de_long, de_contribute, de_tags, de_web, projects_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING de_name, de_short, de_long, de_contribute, de_tags, de_web
        `,
            [name, short, long, contribute, tags, url, projects_id]
        )
        .then(results => {
            console.log(results);
            return results.rows;
        });
};

exports.saveProjectInfoEn = (
    name,
    short,
    long,
    contribute,
    tags,
    url,
    projects_id
) => {
    return db
        .query(
            `
        INSERT INTO projects_en (en_name, en_short, en_long, en_contribute, en_tags, en_web, projects_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING en_name, en_short, en_long, en_contribute, en_tags, en_web
        `,
            [name, short, long, contribute, tags, url, projects_id]
        )
        .then(results => {
            console.log(results);
            return results.rows;
        });
};

exports.getProjectInfoEn = () => {
    return db
        .query(
            `
        SELECT * FROM projects
        LEFT JOIN projects_en
        ON projects.id = projects_id
        `
        )
        .then(results => {
            // console.log(results);
            return results.rows;
        });
};

exports.getProjectInfoDe = () => {
    return db
        .query(
            `
        SELECT * FROM projects
        LEFT JOIN projects_de
        ON projects.id = projects_id
        `
        )
        .then(results => {
            // console.log(results);
            return results.rows;
        });
};
