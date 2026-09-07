require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Customer = require('../models/Customer');
const { verifyEmail, resendVerification, updateProfile } = require('../controllers/auth.controller');
const jwt = require('jsonwebtoken');

// A simple test runner helper
const runTest = async (name, fn) => {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    console.error(error);
    process.exit(1);
  }
};

const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

async function main() {
  console.log('Connecting to database...');
  await connectDB(2); // Try connecting with short retries

  const testEmail = 'testverif@example.com';
  const newEmail = 'newtestverif@example.com';
  const failEmail = 'failsend@example.com';

  // Clean up existing test customers
  await Customer.deleteMany({ email: { $in: [testEmail, newEmail, failEmail] } });

  // 1. Test registration generates token and is unverified
  await runTest('Registration generates token and sets unverified status', async () => {
    const req = {
      body: {
        name: 'Test Verif User',
        email: testEmail,
        mobile: '1234567890',
        password: 'password123'
      }
    };
    const res = mockResponse();

    const { register } = require('../controllers/auth.controller');
    await register(req, res);

    if (res.statusCode !== 201) {
      throw new Error(`Expected registration status 201, got ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }

    const customer = await Customer.findOne({ email: testEmail });
    if (!customer) throw new Error('Customer was not created in DB');
    if (customer.email_verified !== false) throw new Error('Customer should be unverified');
    if (!customer.verificationToken) throw new Error('Verification token should be generated');
    if (!customer.verificationTokenExpiry) throw new Error('Verification token expiry should be set');
  });

  // 2. Test successful verification
  let verificationToken = '';
  await runTest('Successful email verification', async () => {
    const customer = await Customer.findOne({ email: testEmail });
    verificationToken = customer.verificationToken;

    const req = { body: { token: verificationToken } };
    const res = mockResponse();

    await verifyEmail(req, res);

    if (res.statusCode !== 200) {
      throw new Error(`Expected verification status 200, got ${res.statusCode}. Body: ${JSON.stringify(res.body)}`);
    }

    const updatedCustomer = await Customer.findOne({ email: testEmail });
    if (updatedCustomer.email_verified !== true) throw new Error('Email should be marked as verified');
    if (updatedCustomer.verificationToken !== null) throw new Error('Verification token should be cleared');
    if (!updatedCustomer.verifiedAt) throw new Error('verifiedAt timestamp should be set');
  });

  // 3. Test Already Verified Error
  await runTest('Verifying an already verified email returns error', async () => {
    const req = { body: { token: verificationToken } };
    const res = mockResponse();

    await verifyEmail(req, res);

    if (res.statusCode !== 400) {
      throw new Error(`Expected status 400, got ${res.statusCode}`);
    }
    if (res.body.message !== 'Email already verified.') {
      throw new Error(`Expected "Email already verified." error message, got: "${res.body.message}"`);
    }
  });

  // 4. Test Invalid Token Error
  await runTest('Invalid token returns error', async () => {
    const req = { body: { token: 'invalidtokenjwt' } };
    const res = mockResponse();

    await verifyEmail(req, res);

    if (res.statusCode !== 400) {
      throw new Error(`Expected status 400, got ${res.statusCode}`);
    }
  });

  // 5. Test Expired Token Error
  await runTest('Expired token returns error', async () => {
    const customer = await Customer.findOne({ email: testEmail });
    // Manually force unverified and set an expired token
    customer.email_verified = false;
    const expiredToken = jwt.sign({ id: customer._id }, process.env.JWT_SECRET || 'luxegroomsupersecretkey12345', { expiresIn: '24h' });
    customer.verificationToken = expiredToken;
    customer.verificationTokenExpiry = new Date(Date.now() - 5000); // 5 seconds ago
    await customer.save();

    const req = { body: { token: expiredToken } };
    const res = mockResponse();

    await verifyEmail(req, res);

    if (res.statusCode !== 400) {
      throw new Error(`Expected status 400, got ${res.statusCode}`);
    }
    if (!res.body.message.includes('expired')) {
      throw new Error(`Expected expired error message, got: "${res.body.message}"`);
    }
  });

  // 6. Test Resend is NOT rate limited
  await runTest('Resend verification is NOT rate limited', async () => {
    const customer = await Customer.findOne({ email: testEmail });
    customer.email_verified = false;
    customer.verificationRequestTimestamps = [];
    await customer.save();

    // Trigger resend 4 times
    for (let i = 1; i <= 4; i++) {
      const req = { body: { email: testEmail } };
      const res = mockResponse();
      await resendVerification(req, res);
      if (res.statusCode !== 200) {
        throw new Error(`Resend attempt #${i} failed with status ${res.statusCode}`);
      }
    }
  });

  // 7. Profile email update resets status to unverified and sends email
  await runTest('Profile email update resets verification status', async () => {
    const customer = await Customer.findOne({ email: testEmail });
    customer.email_verified = true;
    await customer.save();

    const req = {
      user: { id: customer._id },
      body: {
        name: customer.fullName,
        email: newEmail, // Change email
        mobile: customer.mobile
      }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    if (res.statusCode !== 200) {
      throw new Error(`Expected update profile status 200, got ${res.statusCode}`);
    }

    const updatedCustomer = await Customer.findById(customer._id);
    if (updatedCustomer.email !== newEmail) throw new Error('Email address was not updated');
    if (updatedCustomer.email_verified !== false) throw new Error('Status should be reset to unverified');
    if (!updatedCustomer.verificationToken) throw new Error('Verification token should be generated for new email');
  });

  // 8. Test settings route is exposed at /api/settings
  await runTest('GET /api/settings endpoint returns 200 success', async () => {
    const { getBookingSettings } = require('../controllers/admin.controller');
    const req = {};
    const res = mockResponse();
    await getBookingSettings(req, res);
    if (res.statusCode !== 200) {
      throw new Error(`Expected settings status 200, got ${res.statusCode}`);
    }
    if (!res.body.success || !res.body.data) {
      throw new Error(`Invalid response body: ${JSON.stringify(res.body)}`);
    }
  });

  // 9. Test failed email delivery does not consume rate limit attempt
  await runTest('Failed email delivery does not consume rate limit attempt', async () => {
    const customer = await Customer.create({
      fullName: 'Fail Send User',
      email: 'failsend@example.com',
      mobile: '1112223333',
      password: 'password123',
      email_verified: false,
      verificationRequestTimestamps: []
    });

    // Induce a failed email send by temporarily forcing production env and removing keys
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const originalPublicKey = process.env.EMAILJS_PUBLIC_KEY;
    delete process.env.EMAILJS_PUBLIC_KEY;
    
    const req = { body: { email: 'failsend@example.com' } };
    const res = mockResponse();

    await resendVerification(req, res);

    // Restore environment
    process.env.NODE_ENV = originalNodeEnv;
    if (originalPublicKey) {
      process.env.EMAILJS_PUBLIC_KEY = originalPublicKey;
    }

    if (res.statusCode !== 500) {
      throw new Error(`Expected 500 for failed delivery, got ${res.statusCode}`);
    }

    const updatedCustomer = await Customer.findById(customer._id);
    if (updatedCustomer.verificationRequestTimestamps.length !== 0) {
      throw new Error(`Rate limit attempt was consumed despite email delivery failure! count: ${updatedCustomer.verificationRequestTimestamps.length}`);
    }

    await Customer.deleteOne({ _id: customer._id });
  });

  // Clean up
  await Customer.deleteMany({ email: { $in: [testEmail, newEmail] } });
  await mongoose.disconnect();
  console.log('\nAll integration tests passed successfully.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
