DROP TABLE IF EXISTS posts_de;
DROP TABLE IF EXISTS posts_en;

CREATE TABLE posts_de(
    id SERIAL PRIMARY KEY,
    de_title VARCHAR(300),
    de_post TEXT,
    de_tags VARCHAR(200),
    de_url VARCHAR(200)
);

CREATE TABLE posts_en(
    id SERIAL PRIMARY KEY,
    en_title VARCHAR(300),
    en_post TEXT,
    en_tags VARCHAR(200),
    en_url VARCHAR(200)
);
