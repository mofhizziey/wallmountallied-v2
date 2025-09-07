// debug-email.js
// Run this script to test nodemailer independently
// Usage: node debug-email.js

const nodemailer = require('nodemailer');

async function debugEmailSetup() {
  console.log('🔍 Starting email debug...\n');

  // Check if nodemailer is properly imported
  console.log('1. Checking nodemailer import:');
  console.log('   - nodemailer object:', typeof nodemailer);
  console.log('   - createTransporter function:', typeof nodemailer.createTransporter);
  
  if (typeof nodemailer.createTransporter !== 'function') {
    console.error('❌ nodemailer.createTransporter is not a function!');
    console.log('   Try: npm install nodemailer');
    return;
  }

  // Check environment variables
  console.log('\n2. Checking environment variables:');
  const requiredEnvVars = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    console.log(`   - ${envVar}: ${value ? '✅ Set' : '❌ Missing'}`);
    if (value) {
      console.log(`     Value starts with: ${value.substring(0, 10)}...`);
    }
  }

  // Create transporter
  console.log('\n3. Creating transporter:');
  
  const config = {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  };

  console.log('   Config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    pass: config.auth.pass ? 'Set' : 'Missing'
  });

  let transporter;
  try {
    transporter = nodemailer.createTransporter(config);
    console.log('   ✅ Transporter created:', typeof transporter);
    console.log('   ✅ sendMail method:', typeof transporter.sendMail);
  } catch (error) {
    console.error('   ❌ Error creating transporter:', error.message);
    return;
  }

  // Test connection
  console.log('\n4. Testing SMTP connection:');
  try {
    await transporter.verify();
    console.log('   ✅ SMTP connection successful!');
  } catch (error) {
    console.error('   ❌ SMTP connection failed:', error.message);
    return;
  }

  // Send test email
  console.log('\n5. Sending test email:');
  const testEmail = {
    from: process.env.SENDGRID_FROM_EMAIL,
    to: process.env.SENDGRID_FROM_EMAIL, // Send to yourself for testing
    subject: 'Debug Test Email',
    text: 'This is a test email from the debug script!',
    html: '<h1>Debug Test Email</h1><p>If you receive this, your email setup is working!</p>'
  };

  try {
    const info = await transporter.sendMail(testEmail);
    console.log('   ✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
  } catch (error) {
    console.error('   ❌ Test email failed:', error.message);
    console.error('   Full error:', error);
  }

  console.log('\n🎉 Debug complete!');
}

// Load environment variables if using dotenv
try {
  require('dotenv').config({ path: '.env.local' });
  console.log('📄 Loaded .env.local file');
} catch (err) {
  console.log('📄 No .env.local file found, using system environment variables');
}

debugEmailSetup().catch(console.error);