const axios = require('axios');

async function test(email, password, expectedError) {
  try {
    const res = await axios.post('http://localhost:5000/api/admin/login', { email, password });
    console.log(`PASS: Login succeeded for ${email}`);
  } catch (error) {
    const errMsg = error.response ? error.response.data.message : error.message;
    if (errMsg === expectedError) {
      console.log(`PASS: Received expected error "${errMsg}" for ${email}`);
    } else {
      console.log(`FAIL: Expected "${expectedError}" but got "${errMsg}" for ${email}`);
    }
  }
}

async function run() {
  console.log('--- TESTING ERROR MESSAGES ---');
  // 1. Correct login
  await test('admin@gmail.com', 'Admin@123', null);
  // 2. Admin not found
  await test('nonexistent@gmail.com', 'Admin@123', 'Admin not found');
  // 3. Incorrect password
  await test('admin@gmail.com', 'WrongPass', 'Incorrect password');
}

run();
