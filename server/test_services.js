const axios = require('axios');

async function run() {
  try {
    const resCategories = await axios.get('http://localhost:5000/api/auth/services/categories');
    console.log('Categories:', resCategories.data);

    const resFiltered = await axios.get('http://localhost:5000/api/auth/services?category=Beard');
    console.log('Beard services:', resFiltered.data.data.map(s => `${s.name} (${s.category})`));

    const resHaircut = await axios.get('http://localhost:5000/api/auth/services?category=Haircut');
    console.log('Haircut services:', resHaircut.data.data.map(s => `${s.name} (${s.category})`));
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
}

run();
