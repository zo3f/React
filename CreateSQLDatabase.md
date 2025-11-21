-- Galerij DB aanmaken
CREATE DATABASE IF NOT EXISTS virtuele_galerij
  DEFAULT CHARACTER SET = utf8mb4
  DEFAULT COLLATE = utf8mb4_unicode_ci;
USE virtuele_galerij;

-- USERS
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL DEFAULT NULL,
  -- optioneel: profielvelden
  avatar_url VARCHAR(1024) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ARTISTS
CREATE TABLE artists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bio TEXT NULL,
  website VARCHAR(1024) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_artists_name ON artists(name);

-- ARTWORKS
CREATE TABLE artworks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist_id BIGINT UNSIGNED NOT NULL,
  description TEXT NULL,
  year SMALLINT NULL, -- jaar van creatie (bijv. 1999)
  created_year VARCHAR(32) NULL, -- vrij veld b.v. "c. 1890" of "1990-1995"
  dimensions VARCHAR(128) NULL, -- b.v. "50x70 cm"
  price DECIMAL(10,2) NULL, -- optioneel
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_artworks_title ON artworks(title);
CREATE INDEX idx_artworks_year ON artworks(year);

-- OPTIONAL: FULLTEXT index voor zoeken (MySQL InnoDB ondersteunt dit vanaf 5.6+)
-- Hiermee kun je fulltext searches doen op title en description
ALTER TABLE artworks ADD FULLTEXT ft_artworks_title_desc (title, description);

-- ARTWORK IMAGES
CREATE TABLE artwork_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  artwork_id BIGINT UNSIGNED NOT NULL,
  url VARCHAR(2048) NOT NULL,
  alt_text VARCHAR(512) NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_images_artwork ON artwork_images(artwork_id);

-- TECHNIQUES (technieken)
CREATE TABLE techniques (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ARTWORK_TECHNIQUES (many-to-many)
CREATE TABLE artwork_techniques (
  artwork_id BIGINT UNSIGNED NOT NULL,
  technique_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (artwork_id, technique_id),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (technique_id) REFERENCES techniques(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAVORITES (gebruikers favorieten)
CREATE TABLE favorites (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  artwork_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_artwork (user_id, artwork_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_artwork ON favorites(artwork_id);

-- COMMENTS
CREATE TABLE comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  artwork_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL, -- anoniem toestaan => NULL
  author_name VARCHAR(150) NULL, -- indien anoniem of externe naam
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE, -- moderator kan verbergen
  moderated_by BIGINT UNSIGNED NULL,
  moderated_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_comments_artwork ON comments(artwork_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- VIEW of stored procedure voor makkelijk zoeken (optioneel)
-- Simpele voorbeeld view die artwork met artist naam combineert
CREATE OR REPLACE VIEW vw_artworks_full AS
SELECT
  a.id,
  a.title,
  a.description,
  a.year,
  a.created_year,
  a.dimensions,
  a.price,
  a.is_public,
  a.created_at,
  a.updated_at,
  ar.id AS artist_id,
  ar.name AS artist_name
FROM artworks a
JOIN artists ar ON a.artist_id = ar.id;

-- VOORBEELD DATA (seed)
INSERT INTO users (name, email, password_hash, role)
VALUES
  ('Alice Admin', 'alice@example.com', 'HASHED_PASSWORD_PLACEHOLDER', 'admin'),
  ('Bob Bezoeker', 'bob@example.com', 'HASHED_PASSWORD_PLACEHOLDER', 'user');

INSERT INTO artists (name, bio, website)
VALUES
  ('Rembrandt van Rijn', 'Berucht Nederlandse meester uit de gouden eeuw', NULL),
  ('Contemporary Artist', 'Modern kunstenaar', 'https://artist.example.com');

INSERT INTO artworks (title, artist_id, description, year, dimensions, price)
VALUES
  ('De Nachtwacht (miniatuur)', 1, 'Kleine reproductie van het origineel.', 1642, '30x40 cm', NULL),
  ('Abstract Colours', 2, 'Abstract werk in acryl.', 2021, '100x100 cm', 2500.00);

INSERT INTO artwork_images (artwork_id, url, alt_text, is_primary, sort_order)
VALUES
  (1, 'https://cdn.example.com/nachtwacht.jpg', 'De Nachtwacht - reproductie', TRUE, 0),
  (2, 'https://cdn.example.com/abstract1.jpg', 'Abstract Colours - uitzicht', TRUE, 0);

INSERT INTO techniques (name, description)
VALUES ('Olieverf', 'Olieverf op doek'), ('Acryl', 'Acrylverf');

INSERT INTO artwork_techniques (artwork_id, technique_id)
VALUES (1, 1), (2, 2);

-- Favorieten en comments
INSERT INTO favorites (user_id, artwork_id) VALUES (2, 2);
INSERT INTO comments (artwork_id, user_id, content) VALUES (2, 2, 'Prachtig kleurgebruik!');
