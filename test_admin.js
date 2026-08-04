const axios = require('axios');

async function testAdmin() {
  try {
    // 1. Login
    console.log("Logging in...");
    const loginRes = await axios.post('http://localhost:5000/api/admin/login', {
      email: 'admin@gmail.com',
      password: 'Admin@123'
    });
    const token = loginRes.data.token;
    console.log("Token:", token);

    // 2. Fetch Orders
    console.log("Fetching orders...");
    const ordersRes = await axios.get('http://localhost:5000/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Orders Res:", ordersRes.data);
  } catch (err) {
    if (err.response) {
      console.error("Error Response:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

testAdmin();
