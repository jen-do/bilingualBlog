DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS projects_de;
DROP TABLE IF EXISTS projects_en;

CREATE TABLE projects(
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) CHECK (email <>''),
    image VARCHAR(500),
    user_id INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE projects_de(
    id SERIAL PRIMARY KEY,
    de_name  VARCHAR(200),
    de_short TEXT,
    de_long TEXT,
    de_contribute TEXT,
    de_tags VARCHAR(200),
    de_web VARCHAR(200),
    projects_id INTEGER UNIQUE NOT NULL REFERENCES projects(id)
);

CREATE TABLE projects_en(
    id SERIAL PRIMARY KEY,
    en_name  VARCHAR(200),
    en_short TEXT,
    en_long TEXT,
    en_contribute TEXT,
    en_tags VARCHAR(200),
    en_web VARCHAR(200),
    projects_id INTEGER UNIQUE NOT NULL REFERENCES projects(id)
);
