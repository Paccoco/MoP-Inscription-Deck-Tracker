import React from 'react';

export default function NavBar({ auth, setShowPage, handleLogout }) {
  return (
    <nav style={{ marginBottom: 16 }}>
      <button onClick={() => setShowPage('main')}>Home</button>
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
      {!auth.loggedIn && <>
        <button onClick={() => setShowPage('login')}>Login</button>
        <button onClick={() => setShowPage('register')}>Register</button>
      </>}
    </nav>
  );
}
