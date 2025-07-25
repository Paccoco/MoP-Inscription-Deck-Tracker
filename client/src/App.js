import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

// Mist of Pandaria Inscription Card Names
const CARD_NAMES = [
  'Ace of Crane', 'Two of Crane', 'Three of Crane', 'Four of Crane', 'Five of Crane', 'Six of Crane', 'Seven of Crane', 'Eight of Crane',
  'Ace of Ox', 'Two of Ox', 'Three of Ox', 'Four of Ox', 'Five of Ox', 'Six of Ox', 'Seven of Ox', 'Eight of Ox',
  'Ace of Serpent', 'Two of Serpent', 'Three of Serpent', 'Four of Serpent', 'Five of Serpent', 'Six of Serpent', 'Seven of Serpent', 'Eight of Serpent',
  'Ace of Tiger', 'Two of Tiger', 'Three of Tiger', 'Four of Tiger', 'Five of Tiger', 'Six of Tiger', 'Seven of Tiger', 'Eight of Tiger'
];

// Mist of Pandaria Decks
const DECK_NAMES = ['Crane Deck', 'Ox Deck', 'Serpent Deck', 'Tiger Deck'];

function App() {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({ card_name: '', owner: '', deck: '' });
  const [loading, setLoading] = useState(false);

  // Fetch cards from backend
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/cards');
      setCards(res.data);
    } catch (err) {
      alert('Error fetching cards');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.card_name || !form.owner) return;
    // Infer deck from card name
    const deckPrefix = form.card_name.split(' ')[2]; // e.g., 'Crane' from 'Ace of Crane'
    const deck = DECK_NAMES.find(d => d.includes(deckPrefix));
    try {
      await axios.post('/api/cards', { card_name: form.card_name, owner: form.owner, deck });
      setForm({ card_name: '', owner: '', deck: '' });
      fetchCards();
    } catch (err) {
      alert('Error adding card');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/cards/${id}`);
      fetchCards();
    } catch (err) {
      alert('Error deleting card');
    }
  };

  function getCardCounts(cards) {
    const counts = {};
    cards.forEach(card => {
      counts[card.card_name] = (counts[card.card_name] || 0) + 1;
    });
    return counts;
  }

  function getDeckStatus(cards) {
    const deckStatus = {};
    DECK_NAMES.forEach(deck => {
      const deckCards = CARD_NAMES.filter(name => name.includes(deck.split(' ')[0]));
      const ownedCards = cards.filter(card => card.deck === deck).map(card => card.card_name);
      const missing = deckCards.filter(name => !ownedCards.includes(name));
      deckStatus[deck] = {
        complete: missing.length === 0,
        missing,
        owned: ownedCards.length
      };
    });
    return deckStatus;
  }

  function getDeckCardCounts(cards) {
    // Returns: { deck: { cardName: count } }
    const result = {};
    DECK_NAMES.forEach(deck => {
      result[deck] = {};
      const prefix = deck.split(' ')[0];
      for (let i = 0; i < 8; i++) {
        const cardName = CARD_NAMES.filter(name => name.includes(prefix))[i];
        result[deck][cardName] = cards.filter(card => card.deck === deck && card.card_name === cardName).length;
      }
    });
    return result;
  }

  const cardCounts = getCardCounts(cards);
  const deckStatus = getDeckStatus(cards);
  const deckCardCounts = getDeckCardCounts(cards);

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Inscription Card Tracker</h1>
      {/* Add Card Form at the top */}
      <form onSubmit={handleSubmit}>
        <select
          name="card_name"
          value={form.card_name}
          onChange={handleChange}
          required
        >
          <option value="">Select Card Name</option>
          {CARD_NAMES.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <input
          name="owner"
          placeholder="Owner"
          value={form.owner}
          onChange={handleChange}
          required
        />
        <button type="submit">Add Card</button>
      </form>
      {/* Grid Card Summary */}
      <h2>Card Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Deck</th>
            {['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'].map(label => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DECK_NAMES.map(deck => {
            const prefix = deck.split(' ')[0];
            return (
              <tr key={deck}>
                <td>{deck}</td>
                {CARD_NAMES.filter(name => name.includes(prefix)).map(cardName => (
                  <td key={cardName}>{deckCardCounts[deck][cardName]}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Deck Completion Table */}
      <h2>Deck Status</h2>
      <table>
        <thead>
          <tr>
            <th>Deck</th>
            <th>Owned</th>
            <th>Missing Cards</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {DECK_NAMES.map(deck => {
            const deckTrinketMap = {
              'Crane Deck': { name: "Relic of Chi Ji", id: 79327 },
              'Ox Deck': { name: "Relic of Niuzao", id: 79329 },
              'Serpent Deck': { name: "Relic of Yu'lon", id: 79331 },
              'Tiger Deck': { name: "Relic of Xuen", id: 79328 }
            };
            const trinket = deckTrinketMap[deck];
            return (
              <tr key={deck}>
                <td>
                  <a
                    href={`https://www.wowhead.com/item=${trinket.id}`}
                    data-wowhead={`item=${trinket.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#145c2c', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {deck} <span style={{fontSize:'0.9em',color:'#f5ba42'}}>({trinket.name})</span>
                  </a>
                </td>
                <td>{deckStatus[deck].owned}/8</td>
                <td>{deckStatus[deck].missing.join(', ') || 'None'}</td>
                <td>{deckStatus[deck].complete ? <span style={{color:'#f5ba42',fontWeight:'bold'}}>Deck Complete!</span> : 'Incomplete'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Card Name</th>
              <th>Owner</th>
              <th>Deck</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {cards.map(card => (
              <tr key={card.id}>
                <td>{card.card_name}</td>
                <td>{card.owner}</td>
                <td>{card.deck}</td>
                <td>
                  <button onClick={() => handleDelete(card.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
