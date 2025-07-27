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
import { useAutoRefresh } from './hooks';
import AnnouncementModal from './AnnouncementModal';
import { jwtDecode } from 'jwt-decode';

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

function ActivityLog({ isAdmin, setShowPage }) {
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
          {log.map((entry, i) => {
            let dateStr = entry.timestamp || entry.created_at;
            let dateDisplay = '-';
            if (dateStr) {
              const dateObj = new Date(dateStr);
              dateDisplay = isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleString();
            }
            return (
              <tr key={i}>
                <td>{entry.username || entry.user || '-'}</td>
                <td>{entry.action || entry.message}</td>
                <td>{dateDisplay}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  // All hooks at the top level
  const token = localStorage.getItem('token');
  let initialAuth = { loggedIn: false, isAdmin: false, username: '' };
  if (token) {
    try {
      const decoded = jwtDecode(token);
      initialAuth = {
        loggedIn: true,
        isAdmin: decoded.is_admin || false,
        username: decoded.username || ''
      };
    } catch (e) {}
  }
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({ card_name: '', deck: '' });
  const [auth, setAuth] = useState(initialAuth);
  const [showPage, setShowPage] = useState(token ? 'main' : 'login');
  const [completedDecks, setCompletedDecks] = useState([]);
  const [deckRequests, setDeckRequests] = useState([]);
  const [requestForm, setRequestForm] = useState({ deck: '' });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // All useEffect hooks at the top level
  useEffect(() => {
    fetchCards();
  }, []);
  useEffect(() => {
    console.log('useEffect [auth.loggedIn, showPage] triggered', auth.loggedIn, showPage);
    if (auth.loggedIn) {
      fetchCompletedDecks();
      fetchDeckRequests();
    }
  }, [auth.loggedIn, showPage]);
  useEffect(() => { if (localStorage.getItem('showOnboarding') !== 'false') { setShowOnboarding(true); } }, []);
  useEffect(() => { if (!token) setShowPage('main'); }, [token]);

  // Function definitions
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
      console.log('fetchDeckRequests response:', res);
      setDeckRequests(res.data);
      setErrorMsg('');
    } catch (err) {
      console.error('fetchDeckRequests error:', err);
      setDeckRequests([]);
      setErrorMsg('Error fetching deck requests');
    }
  };
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
  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth({ loggedIn: false, isAdmin: false, username: '' });
    setShowPage('main');
  };
  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('showOnboarding', 'false');
  };
  // Utility functions
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
  const username = profile?.username || auth.username || '';

  // Custom hook (must be called at top level)
  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { localStorage.removeItem('token'); throw { response: { status: 401 } }; }
    const data = await res.json();
    setProfile(data); return data;
  };
  const { sessionExpired, loading, error } = useAutoRefresh(token ? fetchProfile : null, 30000);

  // Early returns after all hooks
  if (!token && !auth.loggedIn) {
    if (showPage === 'register') return <Register onRegister={() => setShowPage('login')} />;
    if (showPage === 'login') return <Login onLogin={user => {
      setAuth({
        loggedIn: true,
        isAdmin: user?.isAdmin || false,
        username: user?.username || ''
      });
      setShowPage('main');
    }} />;
    return (
      <div style={{ maxWidth: 400, margin: 'auto', padding: 40, textAlign: 'center' }}>
        <h1>Mist of Pandaria Card Tracker</h1>
        <p style={{ marginBottom: 32 }}>Welcome! Please log in or register to access the card tracker.</p>
        <button style={{ margin: '8px' }} onClick={() => setShowPage('login')}>Login</button>
        <button style={{ margin: '8px' }} onClick={() => setShowPage('register')}>Register</button>
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="session-expired">
        Session expired. Please log in again.<br />
        <button onClick={() => { localStorage.removeItem('token'); setShowPage('login'); }}>Login</button>
        <button onClick={() => { localStorage.removeItem('token'); setShowPage('register'); }}>Register</button>
      </div>
    );
  }

  // Main app UI
  return (
    <div className="App">
      <OnboardingModal show={showOnboarding} onClose={handleCloseOnboarding} />
      <AnnouncementModal announcement={announcement} onClose={() => setShowAnnouncement(false)} />
      <nav>
        <button onClick={() => setShowPage('main')}>Card Tracker</button>
        {auth.isAdmin && <button onClick={() => setShowPage('admin')}>Admin</button>}
        <button onClick={() => setShowPage('completeddecks')}>Completed Decks</button>
        <button onClick={() => setShowPage('notifications')}>Notifications</button>
        <button onClick={() => setShowPage('activity')}>Activity Log</button>
      </nav>
      {showPage === 'main' && (
        <div className="dashboard-card">
          <h1 className="section-header">Inscription Card Tracker</h1>
          <nav style={{ marginBottom: 16 }}>
            <button onClick={() => setShowPage('mycards')}>My Cards</button>
            <button onClick={() => setShowPage('allcards')}>All Cards</button>
            <button onClick={() => setShowPage('completeddecks')}>Completed Decks</button>
            <button onClick={() => setShowPage('requestdeck')}>Request Deck</button>
            <button onClick={() => setShowPage('deckrequests')}>Deck Requests</button>
            <button onClick={() => setShowPage('profile')}>Profile</button>
            <button onClick={handleLogout}>Logout</button>
            {auth.isAdmin && <button onClick={() => setShowPage('admin')}>Admin</button>}
          </nav>
          <h2>Deck Completion Status</h2>
          <table style={{ margin: '16px auto', minWidth: 400 }}>
            <thead>
              <tr>
                <th>Deck</th>
                <th>Cards Owned</th>
                <th>Missing Cards</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {DECK_NAMES.map(deck => (
                <tr key={deck}>
                  <td>
                    <a
                      href={`https://www.wowhead.com/mop-classic/item=${deckTrinketClassicMap[deck].id}`}
                      data-wowhead={`item=${deckTrinketClassicMap[deck].id}&domain=mop-classic`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#c9e7c9', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {deck}
                    </a>
                  </td>
                  <td>{deckStatus[deck]?.owned || 0}/8</td>
                  <td>{deckStatus[deck]?.missing?.join(', ') || '-'}</td>
                  <td>{deckStatus[deck]?.complete ? 'Complete' : 'Incomplete'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Improved grid layout for each deck showing card counts */}
          <h2 style={{ marginTop: 32 }}>Your Cards by Deck</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', alignItems: 'flex-start' }}>
            {DECK_NAMES.map(deck => {
              const deckCards = CARD_NAMES.filter(name => name.includes(deck.split(' ')[0]));
              return (
                <div key={deck} style={{ border: '1px solid #444', borderRadius: 8, padding: 16, minWidth: 220, background: '#23272f', boxShadow: '0 2px 8px #0006', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 style={{ textAlign: 'center', marginBottom: 12 }}>{deck}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', width: '100%' }}>
                    {deckCards.map(cardName => {
                      const count = cards.filter(card => card.deck === deck && card.card_name === cardName).length;
                      return (
                        <div key={cardName} style={{
                          padding: '8px 10px',
                          borderRadius: 6,
                          background: count > 0 ? '#145c2c' : '#444',
                          color: count > 0 ? '#c9e7c9' : '#bbb',
                          fontWeight: count > 0 ? 'bold' : 'normal',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minWidth: 90
                        }}>
                          <span>{cardName}</span>
                          <span style={{ marginLeft: 8, fontSize: '1.1em', fontWeight: 'bold' }}>{count > 0 ? count : 0}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showPage === 'admin' && (auth.isAdmin ? <Admin setShowPage={setShowPage} /> : <div>Admin access only.</div>)}
      {showPage === 'mycards' && (
        <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
          <h1>My Cards</h1>
          <nav style={{ marginBottom: 16 }}>
            <button onClick={() => setShowPage('main')}>Home</button>
            <button onClick={() => setShowPage('allcards')}>All Cards</button>
            <button onClick={handleLogout}>Logout</button>
          </nav>
          
          {/* Card Addition Form */}
          <div style={{ marginBottom: 24, padding: 16, borderRadius: 8, backgroundColor: '#23272f', boxShadow: '0 2px 8px #0006' }}>
            <h2>Add a Card</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="card_name">Card Name:</label>
                <select
                  id="card_name"
                  name="card_name"
                  value={form.card_name}
                  onChange={handleChange}
                  required
                  style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #444', background: '#191c24', color: 'white' }}
                >
                  <option value="">-- Select a Card --</option>
                  {CARD_NAMES.map(cardName => (
                    <option key={cardName} value={cardName}>{cardName}</option>
                  ))}
                </select>
                <small style={{ color: '#aaa' }}>The deck will be automatically determined from the selected card</small>
              </div>
              <button 
                type="submit" 
                style={{ 
                  padding: '10px', 
                  backgroundColor: '#145c2c', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 4, 
                  cursor: 'pointer',
                  marginTop: 8
                }}
              >
                Add Card
              </button>
            </form>
            {errorMsg && <div style={{ color: '#ff6b6b', marginTop: 12 }}>{errorMsg}</div>}
          </div>
          
          <h2>My Cards</h2>
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
      )}
      {showPage === 'allcards' && (
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
      )}
      {showPage === 'completeddecks' && (
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
                  const total = deck.contributors.length;
                  const byOwner = {};
                  deck.contributors.forEach(c => {
                    byOwner[c.owner] = (byOwner[c.owner] || 0) + 1;
                  });
                  return (
                    <tr key={deck.id}>
                      <td>{deck.deck}</td>
                      <td>
                        <div>
                          {Object.entries(byOwner).map(([owner, count]) => (
                            <div key={owner}>{owner}: {count} card(s) ({((count/total)*100).toFixed(0)}%)</div>
                          ))}
                        </div>
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
      )}
      {showPage === 'requestdeck' && (
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
              const payload = { deck: requestForm.deck };
              if (requestForm.deck === 'Tiger Deck' && requestForm.trinket) {
                payload.trinket = requestForm.trinket;
              }
              await axios.post('/api/deck-requests', payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              setRequestForm({ deck: '', trinket: '' });
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
              onChange={e => setRequestForm({ deck: e.target.value, trinket: '' })}
              required
            >
              <option value="">Select Deck</option>
              {DECK_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {/* Tiger Deck trinket selection */}
            {requestForm.deck === 'Tiger Deck' && (
              <div style={{ marginTop: 12 }}>
                <label htmlFor="trinket">Select Trinket:</label>
                <select
                  name="trinket"
                  value={requestForm.trinket || ''}
                  onChange={e => setRequestForm({ ...requestForm, trinket: e.target.value })}
                  required
                  style={{ marginLeft: 8 }}
                >
                  <option value="">Choose...</option>
                  <option value="Relic of Xuen (79328)">Relic of Xuen (79328) - Agility</option>
                  <option value="Relic of Xuen (79327)">Relic of Xuen (79327) - Strength</option>
                </select>
              </div>
            )}
            <button type="submit" style={{ marginTop: 16 }}>Request Deck</button>
          </form>
          {errorMsg && (
            <div className="error" style={{ marginTop: 12, fontWeight: 'bold', fontSize: '1.1em' }}>
              <span role="img" aria-label="error" style={{ marginRight: 6 }}>❌</span>
              {errorMsg}
            </div>
          )}
        </div>
      )}
      {showPage === 'deckrequests' && (
        <div style={{ maxWidth: 700, margin: 'auto', padding: 20 }}>
          <h1>Deck Requests</h1>
          <nav style={{ marginBottom: 16 }}>
            <button onClick={() => setShowPage('main')}>Home</button>
            <button onClick={() => setShowPage('requestdeck')}>Request Deck</button>
            <button onClick={handleLogout}>Logout</button>
          </nav>
          {console.log('deckRequests', deckRequests)}
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
              {deckRequests.length === 0 ? (
                <tr><td colSpan={auth.isAdmin ? 6 : 5} style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No deck requests found.</td></tr>
              ) : (
                deckRequests.map(req => (
                  <tr key={req.id}>
                    <td>{req.username}</td>
                    <td>{req.deck}{req.trinket ? ` (${req.trinket})` : ''}</td>
                    <td>{req.contribution || '-'}</td>
                    <td>{req.requested_at ? new Date(req.requested_at).toLocaleString() : '-'}</td>
                    <td>{req.fulfilled ? `Fulfilled${req.fulfilled_at ? ' (' + new Date(req.fulfilled_at).toLocaleString() + ')' : ''}` : 'Pending'}</td>
                    {auth.isAdmin && <td>-</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {showPage === 'profile' && <Profile setShowPage={setShowPage} />}
      {showPage === 'notifications' && <Notifications setShowPage={setShowPage} />}
      {showPage === 'activity' && <ActivityLog isAdmin={auth.isAdmin} setShowPage={setShowPage} />}
    </div>
  );
}

export default App;
