const express = require('express');
const { db, query } = require('../utils/database-adapter');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const log = require('../utils/logger');

const router = express.Router();

// Get all cards - optimized query with specific columns
router.get('/', (req, res) => {
  log.info('Cards list requested', { 
    userId: req.user?.id, 
    ip: req.ip 
  });
  
  // Only select the columns we actually need
  db.all('SELECT id, card_name, owner, deck FROM cards', [], (err, rows) => {
    if (err) {
      log.error('Failed to fetch cards', { error: err.message });
      return res.status(500).json({ error: 'Failed to fetch cards.' });
    }
    res.json(rows);
  });
});

// Add a new card
router.post('/', 
  auth, 
  validate(schemas.addCard, 'body'),
  (req, res) => {
    const { card_name, deck } = req.body;
    const owner = req.user.username;
    
    log.info('Card creation attempt', { 
      cardName: card_name, 
      deck, 
      owner, 
      userId: req.user.id,
      ip: req.ip 
    });
    
    db.run(
      'INSERT INTO cards (card_name, owner, deck) VALUES (?, ?, ?)',
      [card_name, owner, deck],
      function (err) {
        if (err) {
          log.error('Failed to add card', { 
            error: err.message, 
            cardName: card_name, 
            deck, 
            owner 
          });
          return res.status(500).json({ error: 'Failed to add card.' });
        }
        
        log.info('Card added successfully', { 
          cardId: this.lastID, 
          cardName: card_name, 
          deck, 
          owner,
          userId: req.user.id 
        });
        res.json({ success: true, id: this.lastID });
      }
    );
  }
);

// Delete a card
router.delete('/:id', 
  auth, 
  validate(schemas.idParam, 'params'),
  (req, res) => {
    const { id } = req.params;
    
    log.info('Card deletion attempt', { 
      cardId: id, 
      userId: req.user.id, 
      username: req.user.username,
      ip: req.ip 
    });
    
    db.get('SELECT owner, card_name, deck FROM cards WHERE id = ?', [id], (err, card) => {
      if (err) {
        log.error('Database error during card deletion', { error: err.message, cardId: id });
        return res.status(500).json({ error: 'Database error occurred.' });
      }
      
      if (!card) {
        log.warn('Attempt to delete non-existent card', { 
          cardId: id, 
          userId: req.user.id, 
          username: req.user.username 
        });
        return res.status(404).json({ error: 'Card not found.' });
      }
      
      // Check if user owns the card or is admin
      if (card.owner !== req.user.username && !req.user.is_admin) {
        log.warn('Unauthorized card deletion attempt', { 
          cardId: id, 
          cardOwner: card.owner, 
          userId: req.user.id, 
          username: req.user.username 
        });
        return res.status(403).json({ error: 'Not authorized to delete this card.' });
      }
      
      db.run('DELETE FROM cards WHERE id = ?', [id], function (err) {
        if (err) {
          log.error('Failed to delete card', { 
            error: err.message, 
            cardId: id, 
            cardName: card.card_name 
          });
          return res.status(500).json({ error: 'Failed to delete card.' });
        }
        
        log.info('Card deleted successfully', { 
          cardId: id, 
          cardName: card.card_name, 
          deck: card.deck,
          deletedBy: req.user.username,
          userId: req.user.id 
        });
        res.json({ success: true });
      });
    });
  }
);

module.exports = router;
