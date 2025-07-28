const express = require('express');
const { db, query } = require('../utils/database-adapter');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all cards - optimized query with specific columns
router.get('/', (req, res) => {
  // Only select the columns we actually need
  db.all('SELECT id, card_name, owner, deck FROM cards', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch cards.' });
    }
    res.json(rows);
  });
});

// Add a new card
router.post('/', auth, (req, res) => {
  const { card_name, deck } = req.body;
  const owner = req.user.username;
  
  if (!card_name || !owner || !deck) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  
  db.run(
    'INSERT INTO cards (card_name, owner, deck) VALUES (?, ?, ?)',
    [card_name, owner, deck],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add card.' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Delete a card
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT owner, card_name, deck FROM cards WHERE id = ?', [id], (err, card) => {
    if (err || !card) {
      return res.status(404).json({ error: 'Card not found.' });
    }
    
    db.run('DELETE FROM cards WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete card.' });
      }
      res.json({ success: true });
    });
  });
});

module.exports = router;
