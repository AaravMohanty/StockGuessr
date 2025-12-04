const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyGameFlow() {
  try {
    // 1. Register
    const username = `testuser_${Date.now()}`;
    const email = `${username}@example.com`;
    const password = 'Password123!';
    
    console.log(`Registering user: ${username}`);
    await axios.post(`${API_URL}/auth/register`, { username, email, password });
    
    // 2. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
    const token = loginRes.data.token;
    console.log('Login successful, token received.');

    const headers = { Authorization: `Bearer ${token}` };

    // 3. Get Random Scenario
    console.log('Fetching random scenario...');
    const scenarioRes = await axios.get(`${API_URL}/scenarios/random`, { headers });
    const scenario = scenarioRes.data;
    console.log(`Scenario fetched: ${scenario.ticker} (${scenario._id})`);

    // 4. Create Match (Solo)
    console.log('Creating solo match...');
    const matchRes = await axios.post(`${API_URL}/matches`, { scenarioId: scenario._id }, { headers });
    const match = matchRes.data;
    console.log(`Match created: ${match._id} (Status: ${match.status})`);

    console.log('Match player2:', match.player2);
    if (match.status === 'IN_PROGRESS' && (!match.player2 || !match.player2.userId)) {
      console.log('SUCCESS: Solo match created successfully.');
    } else {
      console.error('FAILURE: Match status or player2 is incorrect.');
    }

  } catch (error) {
    console.error('Verification failed:', error.response ? error.response.data : error.message);
  }
}

verifyGameFlow();
