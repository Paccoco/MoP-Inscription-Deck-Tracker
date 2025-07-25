import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import Register from './Register';
import Login from './Login';
import Admin from './Admin';
import CompletedDecks from './CompletedDecks';

// Mist of Pandaria Inscription Card Names
const CARD_NAMES = [
  'Ace of Crane', 'Two of Crane', 'Three of Crane', 'Four of Crane', 'Five of Crane', 'Six of Crane', 'Seven of Crane', 'Eight of Crane',
  'Ace of Ox', 'Two of Ox', 'Three of Ox', 'Four of Ox', 'Five of Ox', 'Six of Ox', 'Seven of Ox', 'Eight of Ox',
  'Ace of Serpent', 'Two of Serpent', 'Three of Serpent', 'Four of Serpent', 'Five of Serpent', 'Six of Serpent', 'Seven of Serpent', 'Eight of Serpent',
  'Ace of Tiger', 'Two of Tiger', 'Three of Tiger', 'Four of Tiger', 'Five of Tiger', 'Six of Tiger', 'Seven of Tiger', 'Eight of Tiger'
];

// Mist of Pandaria Decks
const DECK_NAMES = ['Crane Deck', 'Ox Deck', 'Serpent Deck', 'Tiger Deck'];

// MoP Classic trinket IDs
const deckTrinketClassicMap = {
  'Crane Deck': { name: "Relic of Chi Ji", id: 79327 },
  'Ox Deck': { name: "Relic of Niuzao", id: 79329 },
  'Serpent Deck': { name: "Relic of Yu'lon", id: 79331 },
  'Tiger Deck': { name: "Relic of Xuen", id: 79328 }
};

function App() {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({ card_name: '', deck: '' });
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState({ loggedIn: false, isAdmin: false });
  const [showPage, setShowPage] = useState('main');
  const [completedDecks, setCompletedDecks] = useState([]);
  const [deckRequests, setDeckRequests] = useState([]);
  const [requestForm, setRequestForm] = useState({ deck: '' });

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

  const fetchCompletedDecks = async () => {
    try {
      const res = await axios.get('/api/completed-decks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCompletedDecks(res.data);
    } catch (err) {
      setCompletedDecks([]);
    }
  };

  const fetchDeckRequests = async () => {
    try {
      const res = await axios.get('/api/deck-requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDeckRequests(res.data);
    } catch (err) {
      setDeckRequests([]);
    }
  };

  useEffect(() => {
    if (auth.loggedIn) {
      fetchCompletedDecks();
      fetchDeckRequests();
    }
  }, [auth.loggedIn]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.card_name) return;
    // Infer deck from card name
    const deckPrefix = form.card_name.split(' ')[2] || form.card_name.split(' ')[form.card_name.split(' ').length - 1];
    const deck = DECK_NAMES.find(d => d.includes(deckPrefix));
    if (!deck) {
      alert('Could not determine deck from card name.');
      return;
    }
    try {
      await axios.post('/api/cards', { card_name: form.card_name, deck }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setForm({ card_name: '', deck: '' });
      fetchCards();
    } catch (err) {
      alert('Error adding card');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/cards/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth({ loggedIn: false, isAdmin: false });
    setShowPage('main');
  };

  useEffect(() => {
    // Check token and set auth state
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setAuth({ loggedIn: true, isAdmin: !!payload.is_admin });
      } catch {
        setAuth({ loggedIn: false, isAdmin: false });
      }
    }
  }, []);

  // Get logged-in username from JWT
  const getUsername = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).username;
    } catch {
      return null;
    }
  };
  const username = getUsername();

  if (showPage === 'register') return <Register onRegister={() => setShowPage('login')} />;
  if (showPage === 'login') return <Login onLogin={() => { setShowPage('main'); window.location.reload(); }} />;
  if (showPage === 'admin') return auth.isAdmin ? <Admin /> : <div>Admin access only.</div>;
  if (showPage === 'mycards') return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>My Cards</h1>
      <nav style={{ marginBottom: 16 }}>
        <button onClick={() => setShowPage('main')}>Home</button>
        <button onClick={() => setShowPage('allcards')}>All Cards</button>
        <button onClick={handleLogout}>Logout</button>
        {auth.isAdmin && <button onClick={() => setShowPage('admin')}>Admin</button>}
      </nav>
      <table>
        <thead>
          <tr>
            <th>Card Name</th>
            <th>Deck</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cards.filter(card => card.owner === username).map(card => (
            <tr key={card.id}>
              <td>{card.card_name}</td>
              <td>{card.deck}</td>
              <td>
                <button onClick={() => handleDelete(card.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  if (showPage === 'allcards') return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>All Cards</h1>
      <nav style={{ marginBottom: 16 }}>
        <button onClick={() => setShowPage('main')}>Home</button>
        <button onClick={() => setShowPage('mycards')}>My Cards</button>
        <button onClick={handleLogout}>Logout</button>
        {auth.isAdmin && <button onClick={() => setShowPage('admin')}>Admin</button>}
      </nav>
      <table>
        <thead>
          <tr>
            <th>Card Name</th>
            <th>Owner</th>
            <th>Deck</th>
          </tr>
        </thead>
        <tbody>
          {cards.map(card => (
            <tr key={card.id}>
              <td>{card.card_name}</td>
              <td>{card.owner}</td>
              <td>{card.deck}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  if (showPage === 'completeddecks') return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 20 }}>
      <h1>Completed Decks</h1>
      <nav style={{ marginBottom: 16 }}>
        <button onClick={() => setShowPage('main')}>Home</button>
        <button onClick={() => setShowPage('mycards')}>My Cards</button>
        <button onClick={() => setShowPage('allcards')}>All Cards</button>
        <button onClick={handleLogout}>Logout</button>
        {auth.isAdmin && <button onClick={() => setShowPage('admin')}>Admin</button>}
      </nav>
      {completedDecks.length === 0 ? <p>No completed decks yet.</p> : (
        <table>
          <thead>
            <tr>
              <th>Deck</th>
              <th>Contributors</th>
              <th>Disposition</th>
              <th>Recipient</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {completedDecks.map(deck => {
              // Contributor breakdown
              const total = deck.contributors.length;
              const byOwner = {};
              deck.contributors.forEach(c => {
                byOwner[c.owner] = (byOwner[c.owner] || 0) + 1;
              });
              return (
                <tr key={deck.id}>
                  <td>{deck.deck}</td>
                  <td>
                    {Object.entries(byOwner).map(([owner, count]) => (
                      <div key={owner}>{owner}: {count} card(s) ({((count/total)*100).toFixed(0)}%)</div>
                    ))}
                  </td>
                  <td>{deck.disposition}</td>
                  <td>{deck.recipient || '-'}</td>
                  <td>{new Date(deck.completed_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  // Request Deck page
  if (showPage === 'requestdeck') return (
    <div style={{ maxWidth: 500, margin: 'auto', padding: 20 }}>
      <h1>Request a Deck</h1>
      <nav style={{ marginBottom: 16 }}>
        <button onClick={() => setShowPage('main')}>Home</button>
        <button onClick={() => setShowPage('deckrequests')}>Deck Requests</button>
        <button onClick={handleLogout}>Logout</button>
        {auth.isAdmin && <button onClick={() => setShowPage('admin')}>Admin</button>}
      </nav>
      <form onSubmit={async e => {
        e.preventDefault();
        if (!requestForm.deck) return;
        try {
          await axios.post('/api/deck-requests', { deck: requestForm.deck }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setRequestForm({ deck: '' });
          fetchDeckRequests();
          alert('Deck request submitted!');
        } catch (err) {
          alert('Error submitting request');
        }
      }}>
        <select
          name="deck"
          value={requestForm.deck}
          onChange={e => setRequestForm({ deck: e.target.value })}
          required
        >
          <option value="">Select Deck</option>
          {DECK_NAMES.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button type="submit">Request Deck</button>
      </form>
    </div>
  );

  // Deck Requests page
  if (showPage === 'deckrequests') return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 20 }}>
      <h1>Deck Requests</h1>
      <nav style={{ marginBottom: 16 }}>
        <button onClick={() => setShowPage('main')}>Home</button>
        <button onClick={() => setShowPage('requestdeck')}>Request Deck</button>
        <button onClick={handleLogout}>Logout</button>
        {auth.isAdmin && <button onClick={() => setShowPage('admin')}>Admin</button>}
      </nav>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Deck</th>
            <th>Cards Contributed</th>
            <th>Requested At</th>
          </tr>
        </thead>
        <tbody>
          {deckRequests.map(req => {
            const trinket = deckTrinketClassicMap[req.deck];
            return (
              <tr key={req.id}>
                <td>{req.username}</td>
                <td>
                  <a
                    href={`https://www.wowhead.com/mop-classic/item=${trinket.id}`}
                    data-wowhead={`item=${trinket.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#145c2c', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {req.deck}
                  </a>
                </td>
                <td>{req.contribution}</td>
                <td>{new Date(req.requested_at).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (!auth.loggedIn && showPage === 'main') {
    return (
      <div style={{ maxWidth: 400, margin: 'auto', padding: 40, textAlign: 'center' }}>
        <h1>Mist of Pandaria Card Tracker</h1>
        <p style={{ marginBottom: 32 }}>Welcome! Please log in or register to access the card tracker.</p>
        <button style={{ margin: '8px' }} onClick={() => setShowPage('login')}>Login</button>
        <button style={{ margin: '8px' }} onClick={() => setShowPage('register')}>Register</button>
      </div>
    );
  }

  return (
    <div className="App">
      <nav>
        <button onClick={() => setShowPage('main')}>Card Tracker</button>
        <button onClick={() => setShowPage('admin')}>Admin</button>
        <button onClick={() => setShowPage('completedDecks')}>Completed Decks</button>
        {/* Add other navigation buttons as needed */}
      </nav>
      {showPage === 'main' && (
        <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
          <h1>Inscription Card Tracker</h1>
          <nav style={{ marginBottom: 16 }}>
            {!auth.loggedIn && <>
              <button onClick={() => setShowPage('register')}>Register</button>
              <button onClick={() => setShowPage('login')}>Login</button>
            </>}
            {auth.loggedIn && <>
              <button onClick={() => setShowPage('mycards')}>My Cards</button>
              <button onClick={() => setShowPage('allcards')}>All Cards</button>
              <button onClick={() => setShowPage('completeddecks')}>Completed Decks</button>
              <button onClick={() => setShowPage('requestdeck')}>Request Deck</button>
              <button onClick={() => setShowPage('deckrequests')}>Deck Requests</button>
              <button onClick={handleLogout}>Logout</button>
              {auth.isAdmin && <button onClick={() => setShowPage('admin')}>Admin</button>}
            </>}
          </nav>
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
                const trinket = deckTrinketClassicMap[deck];
                return (
                  <tr key={deck}>
                    <td>
                      <a
                        href={`https://www.wowhead.com/mop-classic/item=${trinket.id}`}
                        data-wowhead={`item=${trinket.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#145c2c', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {deck}
                      </a>
                    </td>
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
                const trinket = deckTrinketClassicMap[deck];
                return (
                  <tr key={deck}>
                    <td>
                      <a
                        href={`https://www.wowhead.com/mop-classic/item=${trinket.id}`}
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
          {/* No card list on main page */}
        </div>
      )}
      {showPage === 'admin' && <Admin />}
      {showPage === 'completedDecks' && <CompletedDecks />}
    </div>
  );
}

export default App;
