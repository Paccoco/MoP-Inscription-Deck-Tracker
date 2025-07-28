import React from 'react';
import { DECK_NAMES, CARD_NAMES, deckTrinketClassicMap } from '../constants/gameData';

function CardTracker({ cards, deckStatus, setShowPage, handleLogout, auth }) {
  return (
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
  );
}

export default CardTracker;
