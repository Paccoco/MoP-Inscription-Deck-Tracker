import React, { useEffect, useState } from 'react';
import { useAutoRefresh } from './hooks';

function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [user, setUser] = useState(null);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      throw { response: { status: 401 } };
    }
    const data = await res.json();
    setUser(data);
    return data;
  };

  const { sessionExpired, loading, error } = useAutoRefresh(fetchProfile, 30000);

  useEffect(() => {
    if (user && user.showOnboarding) setShow(true);
  }, [user]);

  if (sessionExpired) return <div className="session-expired">Session expired. Please log in again.</div>;

  return (
    // ...existing modal code...
  );
}

export default OnboardingModal;