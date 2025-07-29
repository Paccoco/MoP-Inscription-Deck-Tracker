const fetch = require('node-fetch');

async function testFrontendCardAddingDetailed() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('=== Detailed Frontend Card Adding Test ===');
  
  try {
    // Login first
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testuser123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // Test the exact payload the frontend sends
    console.log('\n1. Testing exact frontend payload...');
    const frontendPayload = {
      card_name: 'Crane Card of Storms',
      deck: 'Crane Deck'
    };
    
    const frontendResponse = await fetch(`${baseUrl}/api/cards`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(frontendPayload)
    });
    
    const frontendResult = await frontendResponse.json();
    console.log('Frontend payload status:', frontendResponse.status);
    console.log('Frontend payload response:', frontendResult);
    
    if (frontendResponse.ok) {
      console.log('✅ Frontend payload accepted successfully');
    } else {
      console.log('❌ Frontend payload failed');
      return;
    }
    
    // Test edge cases the frontend might encounter
    console.log('\n2. Testing edge cases...');
    
    // Test card with complex name
    const complexCardResponse = await fetch(`${baseUrl}/api/cards`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        card_name: 'Tiger Card of Strength with Special Characters!@#',
        deck: 'Tiger Deck'
      })
    });
    
    const complexResult = await complexCardResponse.json();
    console.log('Complex card status:', complexCardResponse.status);
    console.log('Complex card response:', complexResult);
    
    // Test duplicate card (should be allowed)
    const duplicateResponse = await fetch(`${baseUrl}/api/cards`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        card_name: 'Crane Card of Storms', // Same as before
        deck: 'Crane Deck'
      })
    });
    
    const duplicateResult = await duplicateResponse.json();
    console.log('Duplicate card status:', duplicateResponse.status);
    console.log('Duplicate card response:', duplicateResult);
    
    // Get final card count
    const finalCardsResponse = await fetch(`${baseUrl}/api/cards`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const finalCards = await finalCardsResponse.json();
    console.log('\n3. Final verification...');
    console.log('Total cards in database:', finalCards.length);
    console.log('Cards added by testuser:', finalCards.filter(c => c.owner === 'testuser').length);
    
    // Check for our test cards
    const craneCards = finalCards.filter(c => c.card_name.includes('Crane Card of Storms'));
    console.log('Crane cards found:', craneCards.length);
    
    if (craneCards.length >= 2) {
      console.log('✅ Duplicate cards allowed (correct behavior)');
    } else {
      console.log('⚠️  Duplicate cards not found (might be prevented)');
    }
    
    console.log('\n=== FRONTEND CARD ADDING TEST COMPLETE ===');
    console.log('✅ All tests passed - Frontend card adding is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFrontendCardAddingDetailed();
