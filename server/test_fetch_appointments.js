const axios = require('axios');

const runTest = async () => {
  try {
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post('http://localhost:5000/api/admin/login', {
      email: 'admin@gmail.com',
      password: 'Admin@123'
    });
    
    const token = loginRes.data.token;
    console.log('Successfully logged in. Token:', token);
    
    console.log('2. Fetching appointments as admin...');
    const getRes = await axios.get('http://localhost:5000/api/admin/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Successfully fetched appointments. Count:', getRes.data.data.length);
    console.log('Appointments:', getRes.data.data);
    
  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err.message);
  }
};

runTest();
