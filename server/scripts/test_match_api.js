const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';

async function runTest() {
  try {
    console.log('Starting Match API Test...');

    // 1. Create Users
    const suffix = Math.floor(Math.random() * 100000);
    const user1 = { email: `test1_${Date.now()}_${suffix}@example.com`, username: `test1_${suffix}`, password: 'password123' };
    const user2 = { email: `test2_${Date.now()}_${suffix}@example.com`, username: `test2_${suffix}`, password: 'password123' };
    const user3 = { email: `test3_${Date.now()}_${suffix}@example.com`, username: `test3_${suffix}`, password: 'password123' };

    console.log('Registering users...');
    const res1 = await axios.post(`${API_URL}/auth/register`, user1);
    const token1 = res1.data.token;
    
    const res2 = await axios.post(`${API_URL}/auth/register`, user2);
    const token2 = res2.data.token;

    const res3 = await axios.post(`${API_URL}/auth/register`, user3);
    const token3 = res3.data.token;

    console.log('Users registered.');

    // 2. Create Match (User 1)
    console.log('User 1 creating match...');
    const matchRes = await axios.post(`${API_URL}/matches`, {}, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const match = matchRes.data;
    const joinCode = match.joinCode;
    console.log(`Match created. ID: ${match._id}, Code: ${joinCode}, Status: ${match.status}`);

    if (!joinCode) throw new Error('No join code returned');
    if (match.status !== 'WAITING') throw new Error('Match status is not WAITING');

    // 3. Join Match (User 2)
    console.log('User 2 joining match...');
    const joinRes = await axios.post(`${API_URL}/matches/join`, { joinCode }, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.log(`User 2 joined. Status: ${joinRes.data.status}`);

    if (joinRes.data.status !== 'IN_PROGRESS') throw new Error('Match status did not change to IN_PROGRESS');
    if (joinRes.data.player2.userId !== res2.data.user.id) throw new Error('Player 2 ID mismatch');

    // 4. Try Join Again (User 3) - Should fail (Match full/started)
    console.log('User 3 trying to join (should fail)...');
    try {
      await axios.post(`${API_URL}/matches/join`, { joinCode }, {
        headers: { Authorization: `Bearer ${token3}` }
      });
      throw new Error('User 3 should not have been able to join');
    } catch (err) {
      console.log('User 3 failed to join as expected:', err.response?.data?.message || err.message);
    }

    // 5. Try Join with Wrong Code
    console.log('User 3 trying to join with wrong code...');
    try {
      await axios.post(`${API_URL}/matches/join`, { joinCode: '000000' }, {
        headers: { Authorization: `Bearer ${token3}` }
      });
      throw new Error('Should fail with wrong code');
    } catch (err) {
      console.log('Failed with wrong code as expected:', err.response?.data?.message || err.message);
    }

    console.log('Test Passed Successfully!');
  } catch (error) {
    console.error('Test Failed:', error.message);
    if (error.response) {
        console.error('Response Data:', error.response.data);
    }
  }
}

runTest();
