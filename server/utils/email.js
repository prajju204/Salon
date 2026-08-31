const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, token, otp) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  console.log(`[EMAIL-SERVICE] Verification requested for ${email}`);

  try {
    let transporter;
    let configSource = 'Ethereal (Auto-generated mock account)';

    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      configSource = 'Gmail Service (smtp.gmail.com)';
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
    } else if (process.env.SENDGRID_API_KEY) {
      configSource = 'SendGrid SMTP';
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    } else if (process.env.SES_SMTP_USER && process.env.SES_SMTP_PASS) {
      configSource = 'AWS SES SMTP';
      transporter = nodemailer.createTransport({
        host: process.env.SES_SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SES_SMTP_USER,
          pass: process.env.SES_SMTP_PASS
        }
      });
    } else if (process.env.SMTP_HOST) {
      configSource = 'Custom SMTP Server';
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      console.log('[EMAIL-SERVICE] No SMTP/SendGrid/SES environment variables found. Generating Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    console.log(`[EMAIL-SERVICE] Using transporter configuration: ${configSource}`);

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Luxe Groom" <noreply@luxegroom.com>',
      to: email,
      subject: 'Verify your Luxe Groom Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #c5a880; text-align: center;">Welcome to Luxe Groom</h2>
          <p>Thank you for choosing Luxe Groom. Please verify your email address to unlock all features, including booking appointments, ordering products, and reviewing stylists.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #c5a880; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <div style="text-align: center; margin: 20px 0; background-color: #f3f4f6; padding: 15px; border-radius: 6px;">
            <p style="margin: 0; font-size: 14px; color: #4b5563;">Or use this 6-digit OTP code on the verification page:</p>
            <h1 style="margin: 10px 0 0 0; color: #c5a880; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #9ca3af;">OTP expires in 10 minutes.</p>
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">This verification link will expire in 24 hours.</p>
          <p style="font-size: 11px; color: #9ca3af; text-align: center; word-break: break-all;">If the button above doesn't work, copy and paste this URL into your browser: <br/> ${verifyUrl}</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL-SERVICE] Email sent successfully! MessageID: ${info.messageId}`);
    
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`[EMAIL-SERVICE] Ethereal View URL: ${testUrl}`);
    }

    console.log('---------------- EMAIL VERIFICATION (MOCK/ETHEREAL SEND) ----------------');
    console.log(`To: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Link: ${verifyUrl}`);
    if (testUrl) {
      console.log(`Ethereal Link: ${testUrl}`);
    }
    console.log('-------------------------------------------------------------------------');

    return { 
      success: true, 
      messageId: info.messageId,
      etherealUrl: testUrl || null,
      verificationOtp: otp,
      verificationLink: verifyUrl
    };
  } catch (error) {
    console.error(`[EMAIL-SERVICE] [ERROR] Failed to send email to ${email}:`, error);
    throw new Error(`Email delivery failure: ${error.message}`);
  }
};

module.exports = { sendVerificationEmail };
