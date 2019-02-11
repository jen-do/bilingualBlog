DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS posts_de;
DROP TABLE IF EXISTS posts_en;


CREATE TABLE posts(
    id SERIAL PRIMARY KEY,
    image VARCHAR(300),
    user_id INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE posts_de(
    id SERIAL PRIMARY KEY,
    de_title VARCHAR(300) NOT NULL,
    de_post TEXT,
    de_tags VARCHAR(200),
    post_id INTEGER UNIQUE NOT NULL REFERENCES posts(id)
);

CREATE TABLE posts_en(
    id SERIAL PRIMARY KEY,
    en_title VARCHAR(300) NOT NULL,
    en_post TEXT,
    en_tags VARCHAR(200),
    post_id INTEGER UNIQUE NOT NULL REFERENCES posts(id)
);
