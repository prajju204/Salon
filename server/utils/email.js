const axios = require('axios');

const sendVerificationEmail = async (email, token, toName = 'Client') => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
  
  console.log(`[EMAIL-SERVICE] Verification link requested for ${email} via EmailJS`);

  if (process.env.NODE_ENV === 'test' || process.env.EMAILJS_PUBLIC_KEY === 'test_public_key') {
    console.log('---------------- EMAIL VERIFICATION (MOCK/TEST SEND) ----------------');
    console.log(`To: ${email}`);
    console.log(`Link: ${verifyUrl}`);
    console.log('-------------------------------------------------------------------------');
    return {
      success: true,
      provider: 'Mock EmailJS for Testing',
      verificationLink: verifyUrl
    };
  }

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    const missingKeysMsg = 'EmailJS configuration is missing in .env (Service ID, Template ID, or Public Key).';
    console.warn(`[EMAIL-SERVICE] [WARN] ${missingKeysMsg}`);
    console.log(`[EMAIL-SERVICE] Dev/Simulated Verification link: ${verifyUrl}`);
    // If in production environment, throw so caller knows delivery failed
    if (process.env.NODE_ENV === 'production') {
      throw new Error(missingKeysMsg);
    }
    // Return simulated delivery object for dev
    return {
      success: true,
      simulated: true,
      provider: 'Simulated EmailJS (Unconfigured)',
      verificationLink: verifyUrl
    };
  }

  try {
    console.log('[EMAIL-SERVICE] Requesting EmailJS API...');
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_name: toName,
        to_email: email,
        verification_link: verifyUrl,
        welcome_message: 'Welcome to Luxe Groom! Please click the link below to verify your email address.'
      }
    }, { timeout: 8000 });

    console.log(`[EMAIL-SERVICE] EmailJS response status: ${response.status}. Data: ${response.data}`);
    return {
      success: true,
      provider: 'EmailJS',
      verificationLink: verifyUrl
    };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[EMAIL-SERVICE] [ERROR] EmailJS send failed:', errorDetails);
    throw new Error(`EmailJS delivery failure: ${typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails}`);
  }
};

module.exports = { sendVerificationEmail };

