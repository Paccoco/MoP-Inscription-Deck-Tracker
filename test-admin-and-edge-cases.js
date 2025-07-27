const fetch = require('node-fetch');

async function testAdminAndEdgeCases() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('=== Testing Admin User and Edge Cases ===');
  
  try {
    // Test 1: Login as admin
    console.log('\n1. Testing login as testadmin...');
    const adminLoginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testadmin',
        password: 'testadmin123'
      })
    });
    
    const adminLoginData = await adminLoginResponse.json();
    console.log('Admin login response status:', adminLoginResponse.status);
    console.log('Admin login response:', adminLoginData);
    
    if (!adminLoginResponse.ok) {
      console.error('Admin login failed!');
      return;
    }
    
    const adminToken = adminLoginData.token;
    
    // Test 2: Admin adding a card
    console.log('\n2. Testing admin card addition...');
    const adminCardResponse = await fetch(`${baseUrl}/api/cards`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        card_name: 'Admin Test Card',
        owner: 'testadmin',
        deck: 'Admin Deck'
      })
    });
    
    const adminCardData = await adminCardResponse.json();
    console.log('Admin card addition response status:', adminCardResponse.status);
    console.log('Admin card addition response:', adminCardData);
    
    // Test 3: Missing fields
    console.log('\n3. Testing missing fields...');
    const missingFieldsResponse = await fetch(`${baseUrl}/api/cards`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        card_name: 'Incomplete Card'
        // Missing owner and deck
      })
    });
    
    const missingFieldsData = await missingFieldsResponse.json();
    console.log('Missing fields response status:', missingFieldsResponse.status);
    console.log('Missing fields response:', missingFieldsData);
    
    // Test 4: Invalid JWT token
    console.log('\n4. Testing invalid token...');
    const invalidTokenResponse = await fetch(`${baseUrl}/api/cards`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid.token.here'
      },
      body: JSON.stringify({
        card_name: 'Invalid Token Card',
        owner: 'test',
        deck: 'test'
      })
    });
    
    const invalidTokenData = await invalidTokenResponse.json();
    console.log('Invalid token response status:', invalidTokenResponse.status);
    console.log('Invalid token response:', invalidTokenData);
    
    // Test 5: Get all cards to see current state
    console.log('\n5. Final card list...');
    const finalGetResponse = await fetch(`${baseUrl}/api/cards`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const finalCardsData = await finalGetResponse.json();
    console.log('Final cards response status:', finalGetResponse.status);
    console.log('All cards in database:', finalCardsData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAdminAndEdgeCases();
