const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// SQLite database setup
const dbPath = path.join(__dirname, 'cards.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_name TEXT NOT NULL,
    owner TEXT NOT NULL,
    deck TEXT NOT NULL
  )`);
});

// API route: Get all cards
app.get('/api/cards', (req, res) => {
  db.all('SELECT * FROM cards', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// API route: Add a card
app.post('/api/cards', (req, res) => {
  const { card_name, owner, deck } = req.body;
  if (!card_name || !owner || !deck) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.run(
    'INSERT INTO cards (card_name, owner, deck) VALUES (?, ?, ?)',
    [card_name, owner, deck],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, card_name, owner, deck });
    }
  );
});

// API route: Delete a card
app.delete('/api/cards/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM cards WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ deleted: this.changes });
  });
});

// Serve React static files
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Fallback to React for any non-API route
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
