const fetch = require('node-fetch');

async function testCardAdding() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('=== Testing Card Adding Functionality ===');
  
  try {
    // Test 1: Login as test user
    console.log('\n1. Testing login as testuser...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testuser123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', loginData);
    
    if (!loginResponse.ok) {
      console.error('Login failed!');
      return;
    }
    
    const token = loginData.token;
    console.log('Got JWT token:', token.substring(0, 20) + '...');
    
    // Test 2: Add a card with proper authentication
    console.log('\n2. Testing card addition...');
    const cardResponse = await fetch(`${baseUrl}/api/cards`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        card_name: 'Test Card',
        owner: 'testuser',
        deck: 'Test Deck'
      })
    });
    
    const cardData = await cardResponse.json();
    console.log('Card addition response status:', cardResponse.status);
    console.log('Card addition response:', cardData);
    
    // Test 3: Get all cards to verify addition
    console.log('\n3. Testing card retrieval...');
    const getResponse = await fetch(`${baseUrl}/api/cards`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const cardsData = await getResponse.json();
    console.log('Get cards response status:', getResponse.status);
    console.log('Cards:', cardsData);
    
    // Test 4: Test without authentication
    console.log('\n4. Testing card addition without auth...');
    const noAuthResponse = await fetch(`${baseUrl}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_name: 'Unauthorized Card',
        owner: 'testuser',
        deck: 'Test Deck'
      })
    });
    
    const noAuthData = await noAuthResponse.json();
    console.log('No auth response status:', noAuthResponse.status);
    console.log('No auth response:', noAuthData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testCardAdding();
