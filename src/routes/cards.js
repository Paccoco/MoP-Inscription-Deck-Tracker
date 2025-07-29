const express = require('express');
const { db, query } = require('../utils/database-adapter');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const log = require('../utils/logger');

const router = express.Router();

// Get all cards - optimized query with specific columns
router.get('/', async (req, res) => {
  log.info('Cards list requested', { 
    userId: req.user?.id, 
    ip: req.ip 
  });
  
  try {
    // Query cards with user information - join with users table to get username
    const rows = await query(`
      SELECT c.id, c.card_name, u.username as owner, c.created_at 
      FROM cards c 
      JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC
    `, []);
    res.json(rows);
  } catch (err) {
    log.error('Failed to fetch cards', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch cards.' });
  }
});

// Add a new card
router.post('/', 
  auth, 
  validate(schemas.addCard, 'body'),
  async (req, res) => {
    const { card_name } = req.body;
    const userId = req.user.id;
    const owner = req.user.username;
    
    log.info('Card creation attempt', { 
      cardName: card_name, 
      owner, 
      userId,
      ip: req.ip 
    });
    
    try {
      const result = await query(
        'INSERT INTO cards (card_name, user_id) VALUES ($1, $2) RETURNING id',
        [card_name, userId]
      );
      
      const cardId = result[0].id;
      
      log.info('Card added successfully', { 
        cardId, 
        cardName: card_name, 
        owner,
        userId 
      });
      res.json({ success: true, id: cardId });
    } catch (err) {
      log.error('Failed to add card', { 
        error: err.message, 
        cardName: card_name, 
        owner 
      });
      return res.status(500).json({ error: 'Failed to add card.' });
    }
  }
);

// Delete a card
router.delete('/:id', 
  auth, 
  validate(schemas.idParam, 'params'),
  async (req, res) => {
    const { id } = req.params;
    
    log.info('Card deletion attempt', { 
      cardId: id, 
      userId: req.user.id, 
      username: req.user.username,
      ip: req.ip 
    });
    
    try {
      const cards = await query(`
        SELECT c.card_name, u.username as owner, c.user_id 
        FROM cards c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.id = $1
      `, [id]);
      
      if (cards.length === 0) {
        log.warn('Attempt to delete non-existent card', { 
          cardId: id, 
          userId: req.user.id, 
          username: req.user.username 
        });
        return res.status(404).json({ error: 'Card not found.' });
      }
      
      const card = cards[0];
      
      // Check if user owns the card or is admin
      if (card.user_id !== req.user.id && !req.user.is_admin) {
        log.warn('Unauthorized card deletion attempt', { 
          cardId: id, 
          cardOwner: card.owner, 
          userId: req.user.id, 
          username: req.user.username 
        });
        return res.status(403).json({ error: 'Not authorized to delete this card.' });
      }
      
      await query('DELETE FROM cards WHERE id = $1', [id]);
      
      log.info('Card deleted successfully', { 
        cardId: id, 
        cardName: card.card_name, 
        deletedBy: req.user.username,
        userId: req.user.id 
      });
      res.json({ success: true });
    } catch (err) {
      log.error('Database error during card deletion', { error: err.message, cardId: id });
      return res.status(500).json({ error: 'Database error occurred.' });
    }
  }
);

module.exports = router;
