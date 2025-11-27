// server.js - Virtuele Kunstgalerij API
const express = require('express');
const mysql = require('mysql2/promise'); // Gebruik de promise-versie
//Zie https://help.securityjourney.com/why-we-use-the-mysql2/promise-library-for-javascript-and-typescript
const cors = require('cors');
//Cors is een beveiliging, zie https://mbo-sd.nl/lesson/node-js/express/cors

const app = express();
const PORT = 3000;

// ---- Middleware ----
/* Zonder onderstaande regel krijg je een network error (500)
 CORS (Cross-Origin Resource Sharing) stelt de server in staat om webbrowsers 
 toe te staan verzoeken te doen naar bronnen op een ander domein dan waar de webpagina 
 vandaan komt */
app.use(cors({
  origin: 'http://localhost:5173' // Poort van je frontend naar de backend
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/artwork', express.static('public/artwork'));

// ---- Database Pool ----
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'virtuele_galerij',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/* Rudy: User registratie tijdelijk uitgezet ivm ontwikkelen en testen
// ===============================================================
// USERS (registratie & login – simpel voorbeeld)
// ===============================================================
app.post("/api/users/register", async (req, res) => {
  const { name, email, password_hash } = req.body;

  try {
    const [rows] = await pool.execute(
      `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
      //Werken we met een password hash?
      [name, email, password_hash]
    );
    res.json({ success: true, userId: rows.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  const { email, password_hash } = req.body;

  try {
    const [rows] = await pool.execute(
      `SELECT id, name, role FROM users WHERE email = ? AND password_hash = ?`,
      [email, password_hash]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid login" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
*/
// ===============================================================
// ARTWORKS: lijst en zoeken
// ===============================================================
app.get("/api/artworks", async (req, res) => {
  const search = req.query.q;

  let sql = `
    SELECT a.*, ar.name AS artist_name 
    FROM artworks a
    JOIN artists ar ON a.artist_id = ar.id
    WHERE a.is_public = 1
  `;

  let params = [];

  // Zoekfunctionaliteit
  if (search) {
    sql += ` AND MATCH(a.title, a.description) AGAINST(?) `;
    params.push(search);
  }

  //Aanpassing naar Artwork URL
    try {
    const [artworks] = await pool.execute(sql, params);

    // Haal afbeeldingen op voor elk kunstwerk
    for (let artwork of artworks) {
      const [images] = await pool.execute(
        `SELECT * FROM artwork_images WHERE artwork_id = ? ORDER BY sort_order LIMIT 1`,
        [artwork.id]
      );
      artwork.image = images[0] || null;
    }

    res.json(artworks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

  //verkeerde URL van de afbeeldingen????
  /*try {
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});*/

// ===============================================================
// ARTWORK: bekijk een enkel kunstwerk
// ===============================================================
app.get("/api/artworks/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const [[artwork]] = await pool.execute(`
      SELECT a.*, ar.name AS artist_name
      FROM artworks a
      JOIN artists ar ON a.artist_id = ar.id
      WHERE a.id = ?
    `, [id]);

    if (!artwork) return res.status(404).json({ error: "Artwork not found" });

    const [images] = await pool.execute(
      `SELECT * FROM artwork_images WHERE artwork_id = ? ORDER BY sort_order`,
      [id]
    );

    const [techniques] = await pool.execute(`
      SELECT t.id, t.name 
      FROM techniques t
      JOIN artwork_techniques at ON t.id = at.technique_id
      WHERE at.artwork_id = ?
    `, [id]);

    const [comments] = await pool.execute(`
      SELECT c.*, u.name AS user_name
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.artwork_id = ? AND c.is_visible = 1
      ORDER BY c.created_at DESC
    `, [id]);

    res.json({ artwork, images, techniques, comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// ARTWORK: ADMIN – CREATE
// ===============================================================
app.post("/api/artworks", async (req, res) => {
  const { title, artist_id, description, year, dimensions, price } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO artworks (title, artist_id, description, year, dimensions, price) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, artist_id, description, year, dimensions, price]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// ARTWORK: ADMIN – UPDATE
// ===============================================================
app.put("/api/artworks/:id", async (req, res) => {
  const id = req.params.id;
  const { title, description, year, dimensions, price } = req.body;

  try {
    await pool.execute(
      `UPDATE artworks SET title=?, description=?, year=?, dimensions=?, price=? WHERE id=?`,
      [title, description, year, dimensions, price, id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// ARTWORK: ADMIN – DELETE
// ===============================================================
app.delete("/api/artworks/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await pool.execute(`DELETE FROM artworks WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// FAVORITES – ADD
// ===============================================================
app.post("/api/favorites", async (req, res) => {
  const { user_id, artwork_id } = req.body;

  try {
    await pool.execute(
      `INSERT IGNORE INTO favorites (user_id, artwork_id) VALUES (?, ?)`,
      [user_id, artwork_id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// FAVORITES – LIST
// ===============================================================
app.get("/api/favorites/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const [rows] = await pool.execute(`
      SELECT f.id, a.*, ar.name AS artist_name
      FROM favorites f
      JOIN artworks a ON a.id = f.artwork_id
      JOIN artists ar ON ar.id = a.artist_id
      WHERE f.user_id = ?
    `, [userId]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// COMMENTS – ADD
// ===============================================================
app.post("/api/comments", async (req, res) => {
  const { artwork_id, user_id, content, author_name } = req.body;

  try {
    const [result] = await pool.execute(`
      INSERT INTO comments (artwork_id, user_id, content, author_name)
      VALUES (?, ?, ?, ?)
    `, [artwork_id, user_id || null, content, author_name || null]);

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================================================
// SERVER START
// ===============================================================
app.listen(PORT, () =>
  console.log(`Galerij API draait op http://localhost:${PORT}`)
);
