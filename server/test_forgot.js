const axios = require('axios');

async function run() {
  try {
    console.log('Sending forgot-password request...');
    const res = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      email: 'prajwaldp03@gmail.com'
    });
    console.log('Response status:', res.status);
    console.log('Response data:', res.data);
  } catch (error) {
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

run();
