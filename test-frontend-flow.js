const fetch = require('node-fetch');

async function testFrontendCardAdding() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('=== Testing Frontend Card Adding Flow ===');
  
  try {
    // Step 1: Test if the main page loads
    console.log('\n1. Testing main page load...');
    const mainPageResponse = await fetch(`${baseUrl}/`);
    console.log('Main page status:', mainPageResponse.status);
    
    if (!mainPageResponse.ok) {
      console.error('Main page failed to load!');
      return;
    }
    
    // Step 2: Test login endpoint (what frontend uses)
    console.log('\n2. Testing frontend login...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testuser123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    console.log('Login response:', loginData);
    
    if (!loginResponse.ok) {
      console.error('Frontend login failed!');
      return;
    }
    
    const token = loginData.token;
    
    // Step 3: Test card addition (what frontend does)
    console.log('\n3. Testing frontend card addition...');
    const cardData = {
      card_name: 'Frontend Test Card',
      owner: 'testuser',
      deck: 'Frontend Test Deck'
    };
    
    const addCardResponse = await fetch(`${baseUrl}/api/cards`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cardData)
    });
    
    const cardResult = await addCardResponse.json();
    console.log('Add card status:', addCardResponse.status);
    console.log('Add card response:', cardResult);
    
    if (!addCardResponse.ok) {
      console.error('Frontend card addition failed!');
      console.error('Error details:', cardResult);
      return;
    }
    
    // Step 4: Verify card was added by fetching all cards
    console.log('\n4. Verifying card was added...');
    const getCardsResponse = await fetch(`${baseUrl}/api/cards`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const allCards = await getCardsResponse.json();
    console.log('Get cards status:', getCardsResponse.status);
    console.log('All cards:', allCards);
    
    // Check if our test card is in the list
    const ourCard = allCards.find(card => card.card_name === 'Frontend Test Card');
    if (ourCard) {
      console.log('\n✅ SUCCESS: Frontend card adding is working correctly!');
      console.log('Test card found:', ourCard);
    } else {
      console.log('\n❌ ERROR: Test card not found in database!');
    }
    
    // Step 5: Test error cases that frontend might encounter
    console.log('\n5. Testing frontend error handling...');
    
    // Test missing fields (what happens if frontend sends incomplete data)
    const incompleteCardResponse = await fetch(`${baseUrl}/api/cards`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        card_name: 'Incomplete Card'
        // Missing owner and deck
      })
    });
    
    const incompleteResult = await incompleteCardResponse.json();
    console.log('Incomplete card status:', incompleteCardResponse.status);
    console.log('Incomplete card response:', incompleteResult);
    
    if (incompleteCardResponse.status === 400) {
      console.log('✅ Error handling working correctly');
    } else {
      console.log('❌ Error handling not working as expected');
    }
    
  } catch (error) {
    console.error('❌ Frontend test failed with error:', error);
  }
}

testFrontendCardAdding();
