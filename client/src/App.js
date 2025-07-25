import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import Register from './Register';
import Login from './Login';
import Admin from './Admin';
import CompletedDecks from './CompletedDecks';
import Profile from './Profile';
import Notifications from './Notifications';
import './Notifications.css';

function OnboardingModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div className="onboarding-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
      <div style={{ background: '#23272f', color: '#c9e7c9', maxWidth: 400, margin: '80px auto', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px #0008' }}>
        <h2>Welcome to MoP Card Tracker!</h2>
        <ul>
          <li>Track your cards and decks</li>
          <li>Request decks and get notified</li>
          <li>Export/import your collection</li>
          <li>Customize your theme</li>
          <li>Check analytics and history</li>
        </ul>
        <button onClick={onClose} style={{ marginTop: 16 }}>Got it!</button>
      </div>
    </div>
  );
}

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
  'Crane Deck': { name: "Relic of Chi Ji", id: 79330 },
  'Ox Deck': { name: "Relic of Niuzao", id: 79329 },
  'Serpent Deck': { name: "Relic of Yu'lon", id: 79331 },
  'Tiger Deck': { name: "Relic of Xuen", id: 79328 }
};

function ActivityLog({ isAdmin }) {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const endpoint = isAdmin ? '/api/activity/all' : '/api/activity';
    const token = localStorage.getItem('token');
    axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        // Defensive: only set log if response is an array
        if (Array.isArray(res.data)) {
          setLog(res.data);
        } else {
          setLog([]);
          setError('No activity data received.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load activity log from server.');
        setLoading(false);
      });
  }, [isAdmin]);

  if (loading) return <div>Loading activity log...</div>;
  if (!Array.isArray(log) || log.length === 0) return <div>No activity to display.</div>;
  return (
    <div className="activity-log">
      <h2>Activity Log {isAdmin ? '(All Users)' : ''}</h2>
      <table className="activity-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {log.map((entry, i) => (
            <tr key={i}>
              <td>{entry.username}</td>
              <td>{entry.action}</td>
              <td>{new Date(entry.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({ card_name: '', deck: '' });
  const [auth, setAuth] = useState({ loggedIn: false, isAdmin: false });
  const [showPage, setShowPage] = useState('main');
  const [completedDecks, setCompletedDecks] = useState([]);
  const [deckRequests, setDeckRequests] = useState([]);
  const [requestForm, setRequestForm] = useState({ deck: '' });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch cards from backend
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await axios.get('/api/cards');
      setCards(res.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Error fetching cards');
    }
  };

  const fetchCompletedDecks = async () => {
    try {
      const res = await axios.get('/api/completed-decks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCompletedDecks(res.data);
      setErrorMsg('');
    } catch (err) {
      setCompletedDecks([]);
      setErrorMsg('Error fetching completed decks');
    }
  };

  const fetchDeckRequests = async () => {
    try {
      const res = await axios.get('/api/deck-requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDeckRequests(res.data);
      setErrorMsg('');
    } catch (err) {
      setDeckRequests([]);
      setErrorMsg('Error fetching deck requests');
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
      setErrorMsg('Could not determine deck from card name.');
      return;
    }
    try {
      await axios.post('/api/cards', { card_name: form.card_name, deck }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setForm({ card_name: '', deck: '' });
      fetchCards();
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Error adding card');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/cards/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchCards();
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Error deleting card');
    }
  };

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
        setAuth({ loggedIn: true, isAdmin: !!payload.is_admin, username: payload.username });
      } catch {
        setAuth({ loggedIn: false, isAdmin: false, username: undefined });
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

  useEffect(() => {
    if (localStorage.getItem('showOnboarding') !== 'false') {
      setShowOnboarding(true);
    }
  }, []);
  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('showOnboarding', 'false');
  };

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
          setErrorMsg('');
          alert('Deck request submitted!');
        } catch (err) {
          const msg = err.response?.data?.error || 'Error submitting request';
          setErrorMsg(msg);
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
      </nav>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Deck</th>
            <th>Cards Contributed</th>
            <th>Requested At</th>
            <th>Status</th>
            {auth.isAdmin && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {deckRequests.map(req => {
            const trinket = deckTrinketClassicMap[req.deck];
            // Debug: Log current user and request user for Remove button logic
            console.log('DEBUG: auth.username:', auth.username, 'req.username:', req.username, 'isAdmin:', auth.isAdmin);
            const isOwnRequest = auth.username === req.username;
            const canRemove = auth.isAdmin || isOwnRequest;
            return (
              <tr key={req.id} style={{ background: req.fulfilled ? '#e0ffe0' : undefined }}>
                <td>
                  {req.username}
                  {isOwnRequest && (
                    <span style={{ marginLeft: 8, color: '#f5ba42', fontWeight: 'bold', fontSize: '0.95em' }} title="This is your request">(You)</span>
                  )}
                </td>
                <td>
                  {req.deck === 'Tiger Deck' ? (
                    <span>
                      <a
                        href={`https://www.wowhead.com/mop-classic/item=${deckTrinketClassicMap['Tiger Deck'].id}`}
                        data-wowhead={`item=${deckTrinketClassicMap['Tiger Deck'].id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#145c2c', textDecoration: 'underline', cursor: 'pointer', marginRight: 8 }}
                      >Relic of Xuen (79328)</a>
                      {req.deck}
                    </span>
                  ) : (
                    <a
                      href={`https://www.wowhead.com/mop-classic/item=${trinket.id}`}
                      data-wowhead={`item=${trinket.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#145c2c', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {req.deck}
                    </a>
                  )}
                </td>
                <td>{req.contribution}</td>
                <td>{new Date(req.requested_at).toLocaleString()}</td>
                <td>{req.fulfilled ? `Fulfilled${req.fulfilled_at ? ' (' + new Date(req.fulfilled_at).toLocaleString() + ')' : ''}` : 'Pending'}</td>
                <td>
                  {!req.fulfilled && (
                    <>
                      {auth.isAdmin && (
                        <button onClick={async () => {
                          const reason = prompt('Enter reason for removing this request (sent to user):');
                          if (!reason) return;
                          await axios.delete(`/api/deck-requests/${req.id}`, {
                            data: { reason },
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                          });
                          fetchDeckRequests();
                        }}>Remove (Admin)</button>
                      )}
                      {isOwnRequest && (
                        <button onClick={async () => {
                          await axios.delete(`/api/deck-requests/${req.id}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                          });
                          fetchDeckRequests();
                        }}>Remove</button>
                      )}
                    </>
                  )}
                  {auth.isAdmin && !req.fulfilled && (
                    <button onClick={async () => {
                      await axios.post('/api/deck-requests/fulfill', { requestId: req.id }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                      });
                      fetchDeckRequests();
                    }}>Mark Fulfilled</button>
                  )}
                </td>
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
      <OnboardingModal show={showOnboarding} onClose={handleCloseOnboarding} />
      <nav>
        <button onClick={() => setShowPage('main')}>Card Tracker</button>
        {auth.isAdmin && <button onClick={() => setShowPage('admin')}>Admin</button>}
        <button onClick={() => setShowPage('completedDecks')}>Completed Decks</button>
        <button onClick={() => setShowPage('notifications')}>Notifications</button>
        <button onClick={() => setShowPage('activity')}>Activity Log</button>
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
              <button onClick={() => setShowPage('profile')}>Profile</button>
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
      {showPage === 'profile' && <Profile />}
      {showPage === 'notifications' && <Notifications />}
      {showPage === 'activity' && <ActivityLog isAdmin={auth.isAdmin} />}
      {/* Analytics dashboard placeholder */}
      {/* Add more detailed charts and export options here */}
      {/* Example: notification delivery rates, user engagement */}

      {/* Integrations placeholder: Add support for Telegram, Slack, and per-platform notification preferences here. */}

      {/* Performance: Pagination for activity logs and optimized notification delivery queries can be added here. */}
    </div>
  );
}

export default App;
