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
    
    console.log('2. Adding a product...');
    const addRes = await axios.post('http://localhost:5000/api/admin/products', {
      name: 'Test Beard Oil',
      price: 1500,
      description: 'A test organic beard oil',
      category: 'Beard Care',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Successfully added product. Response:', addRes.data);
    
    console.log('3. Fetching products as customer...');
    const getRes = await axios.get('http://localhost:5000/api/auth/products');
    console.log('Successfully fetched products. Count:', getRes.data.data.length);
    console.log('Products:', getRes.data.data.map(p => p.name));
    
  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err.message);
  }
};

runTest();
