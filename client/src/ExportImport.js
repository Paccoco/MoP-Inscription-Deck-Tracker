import React, { useRef, useState } from 'react';
import axios from 'axios';

export default function ExportImport({ isAdmin }) {
  const [message, setMessage] = useState('');
  const cardsInput = useRef();
  const decksInput = useRef();

  const exportCards = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/export/cards', {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cards.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportDecks = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/export/decks', {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'completed_decks.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const importCards = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const file = cardsInput.current.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const res = await axios.post('/api/import/cards', text, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/csv' }
      });
      setMessage(`Imported ${res.data.imported} cards.`);
    } catch {
      setMessage('Import failed.');
    }
  };

  const importDecks = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const file = decksInput.current.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const res = await axios.post('/api/import/decks', text, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/csv' }
      });
      setMessage(`Imported ${res.data.imported} completed decks.`);
    } catch {
      setMessage('Import failed.');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>Export / Import Data</h2>
      <div style={{ marginBottom: 18 }}>
        <button onClick={exportCards}>Export My Cards (CSV)</button>
        <button onClick={exportDecks} style={{ marginLeft: 8 }}>Export Completed Decks (CSV)</button>
      </div>
      {isAdmin && (
        <div style={{ marginBottom: 18 }}>
          <form onSubmit={importCards} style={{ marginBottom: 12 }}>
            <label>Import Cards (CSV): <input type="file" accept=".csv" ref={cardsInput} /></label>
            <button type="submit">Import</button>
          </form>
          <form onSubmit={importDecks}>
            <label>Import Completed Decks (CSV): <input type="file" accept=".csv" ref={decksInput} /></label>
            <button type="submit">Import</button>
          </form>
        </div>
      )}
      {message && <div style={{ color: '#145c2c', marginTop: 12 }}>{message}</div>}
    </div>
  );
}
