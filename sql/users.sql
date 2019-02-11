DROP TABLE IF EXISTS users;


CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE CHECK (email <>''),
    pass VARCHAR(200) NOT NULL,
    editor BOOLEAN DEFAULT false
)
