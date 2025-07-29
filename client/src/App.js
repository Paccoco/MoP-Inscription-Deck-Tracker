import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import './App.css';
import Register from './Register';
import Login from './Login';
import Admin from './Admin';
import Profile from './Profile';
import Notifications from './Notifications';
import './Notifications.css';
import { useAutoRefresh } from './hooks';
import AnnouncementModal from './AnnouncementModal';
import OnboardingModal from './OnboardingModal';
import ActivityLog from './ActivityLog';
import CompletedDecks from './CompletedDecks';
import DeckRequests from './DeckRequests';
import CardTracker from './components/CardTracker';
import { CARD_NAMES, DECK_NAMES } from './constants/gameData';
import { jwtDecode } from 'jwt-decode';

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
  // Note: completedDecks and deckRequests will be used in future features
  // eslint-disable-next-line no-unused-vars
  const [completedDecks, setCompletedDecks] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [deckRequests, setDeckRequests] = useState([]);
  const [requestForm, setRequestForm] = useState({ deck: '' });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Function definitions with useCallback optimization
  const fetchCards = useCallback(async () => {
    try {
      const res = await axios.get('/api/cards');
      setCards(res.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Error fetching cards');
    }
  }, []);

  const fetchCompletedDecks = useCallback(async () => {
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
  }, []);

  const fetchDeckRequests = useCallback(async () => {
    try {
      const res = await axios.get('/api/deck-requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDeckRequests(res.data);
      setErrorMsg('');
    } catch (err) {
      // Error logging handled by error boundaries
      setDeckRequests([]);
      setErrorMsg('Error fetching deck requests');
    }
  }, []);
  
  // Add fetchAnnouncements function
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await axios.get('/api/announcement', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.data && res.data.length > 0) {
        // Check for active announcements that haven't expired
        const now = new Date();
        const activeAnnouncements = res.data.filter(a => 
          a.active && (!a.expiry || new Date(a.expiry) > now)
        );
        
        if (activeAnnouncements.length > 0) {
          // Check if the user has already dismissed this announcement
          const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
          
          // Find announcements that haven't been dismissed
          const unreadAnnouncements = activeAnnouncements.filter(a => 
            !dismissedAnnouncements.includes(a.id)
          );
          
          if (unreadAnnouncements.length > 0) {
            // The links should already be parsed by the server
            const announcement = unreadAnnouncements[0];
            setAnnouncement(announcement);
            setShowAnnouncement(true);
          }
        }
      } else {
        // Debug logging removed for production
      }
    } catch (err) {
      // Error logging handled by error boundaries
    }
  }, []);
  
  const handleChange = useCallback((e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }, [form]);

  const handleSubmit = useCallback(async (e) => {
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
      await axios.post('/api/cards', { card_name: form.card_name }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setForm({ card_name: '', deck: '' });
      fetchCards();
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Error adding card');
    }
  }, [form, fetchCards]);

  const handleDelete = useCallback(async (id) => {
    try {
      await axios.delete(`/api/cards/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchCards();
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Error deleting card');
    }
  }, [fetchCards]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setAuth({ loggedIn: false, isAdmin: false, username: '' });
    setShowPage('main');
  }, []);

  const handleCloseOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem('showOnboarding', 'false');
  }, []);
  // Utility functions
  // Memoized expensive computations
  const deckStatus = useMemo(() => {
    const status = {};
    DECK_NAMES.forEach(deck => {
      const deckCards = CARD_NAMES.filter(name => name.includes(deck.split(' ')[0]));
      const ownedCards = cards.filter(card => card.deck === deck).map(card => card.card_name);
      // Get unique card names to avoid counting duplicates
      const uniqueOwnedCards = [...new Set(ownedCards)];
      const missing = deckCards.filter(name => !uniqueOwnedCards.includes(name));
      status[deck] = {
        complete: missing.length === 0,
        missing,
        owned: uniqueOwnedCards.length
      };
    });
    return status;
  }, [cards]);

  // Note: deckCardCounts available if needed for future features
  // const deckCardCounts = getDeckCardCounts(cards);
  const username = useMemo(() => profile?.username || auth.username || '', [profile, auth.username]);

  // useEffect hooks (must be after function definitions)
  useEffect(() => {
    fetchCards();
    fetchAnnouncements();
  }, [fetchCards, fetchAnnouncements]);
  
  useEffect(() => {
    if (auth.loggedIn) {
      fetchCompletedDecks();
      fetchDeckRequests();
      fetchAnnouncements();
    }
  }, [auth.loggedIn, showPage, fetchCompletedDecks, fetchDeckRequests, fetchAnnouncements]);
  
  useEffect(() => { 
    if (localStorage.getItem('showOnboarding') !== 'false') { 
      setShowOnboarding(true); 
    } 
  }, []);
  
  useEffect(() => { 
    if (!token) setShowPage('main'); 
  }, [token]);

  // Custom hook (must be called at top level)
  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { 
      localStorage.removeItem('token'); 
      throw new Error('Session expired');
    }
    const data = await res.json();
    setProfile(data); return data;
  };
  const { sessionExpired } = useAutoRefresh(token ? fetchProfile : null, 30000);

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
      <div className="auth-welcome-container">
        <h1>Mist of Pandaria Card Tracker</h1>
        <p className="margin-bottom-32">Welcome! Please log in or register to access the card tracker.</p>
        <button className="margin-8" onClick={() => setShowPage('login')}>Login</button>
        <button className="margin-8" onClick={() => setShowPage('register')}>Register</button>
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
      {showAnnouncement && <AnnouncementModal announcement={announcement} onClose={() => setShowAnnouncement(false)} />}
      <nav>
        <button onClick={() => setShowPage('main')}>Card Tracker</button>
        {auth.isAdmin && <button onClick={() => setShowPage('admin')}>Admin</button>}
        <button onClick={() => setShowPage('completeddecks')}>Completed Decks</button>
        <button onClick={() => setShowPage('notifications')}>Notifications</button>
        <button onClick={() => setShowPage('activity')}>Activity Log</button>
      </nav>
      {showPage === 'main' && (
        <CardTracker 
          cards={cards} 
          deckStatus={deckStatus} 
          setShowPage={setShowPage} 
          handleLogout={handleLogout} 
          auth={auth} 
        />
      )}
      {showPage === 'admin' && (auth.isAdmin ? <Admin setShowPage={setShowPage} /> : <div>Admin access only.</div>)}
      {showPage === 'mycards' && (
        <div className="form-container">
          <h1>My Cards</h1>
          <nav className="margin-bottom-16">
            <button onClick={() => setShowPage('main')}>Home</button>
            <button onClick={() => setShowPage('allcards')}>All Cards</button>
            <button onClick={handleLogout}>Logout</button>
          </nav>
          
          {/* Card Addition Form */}
          <div className="card-form-container">
            <h2>Add a Card</h2>
            <form onSubmit={handleSubmit} className="flex-column-gap">
              <div className="flex-column-small-gap">
                <label htmlFor="card_name">Card Name:</label>
                <select
                  id="card_name"
                  name="card_name"
                  value={form.card_name}
                  onChange={handleChange}
                  required
                  className="card-select"
                >
                  <option value="">-- Select a Card --</option>
                  {CARD_NAMES.map(cardName => (
                    <option key={cardName} value={cardName}>{cardName}</option>
                  ))}
                </select>
                <small className="small-light-text">The deck will be automatically determined from the selected card</small>
              </div>
              <button 
                type="submit" 
                className="submit-button"
                style={{ 
                  backgroundColor: '#145c2c', 
                  marginTop: 8
                }}
              >
                Add Card
              </button>
            </form>
            {errorMsg && <div className="error-text">{errorMsg}</div>}
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
        <div className="form-container">
          <h1>All Cards</h1>
          <nav className="margin-bottom-16">
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
      {showPage === 'completeddecks' && <CompletedDecks setShowPage={setShowPage} />}
      {showPage === 'requestdeck' && (
        <div className="narrow-container">
          <h1>Request a Deck</h1>
          <nav className="margin-bottom-16">
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
              <div className="margin-top-12">
                <label htmlFor="trinket">Select Trinket:</label>
                <select
                  name="trinket"
                  value={requestForm.trinket || ''}
                  onChange={e => setRequestForm({ ...requestForm, trinket: e.target.value })}
                  required
                  className="margin-left-8"
                >
                  <option value="">Choose...</option>
                  <option value="Relic of Xuen (79328)">Relic of Xuen (79328) - Agility</option>
                  <option value="Relic of Xuen (79327)">Relic of Xuen (79327) - Strength</option>
                </select>
              </div>
            )}
            <button type="submit" className="margin-top-16">Request Deck</button>
          </form>
          {errorMsg && (
            <div className="error error-bold">
              <span role="img" aria-label="error" className="margin-left-8">❌</span>
              {errorMsg}
            </div>
          )}
        </div>
      )}
      {showPage === 'deckrequests' && <DeckRequests setShowPage={setShowPage} />}
      {showPage === 'profile' && <Profile setShowPage={setShowPage} />}
      {showPage === 'notifications' && <Notifications setShowPage={setShowPage} />}
      {showPage === 'activity' && <ActivityLog isAdmin={auth.isAdmin} setShowPage={setShowPage} />}
    </div>
  );
}

export default App;
