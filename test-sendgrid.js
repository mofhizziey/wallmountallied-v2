// test-sendgrid.js
// Simple test script for SendGrid
// Usage: node test-sendgrid.js

const sgMail = require('@sendgrid/mail');

async function testSendGrid() {
  console.log('🧪 Testing SendGrid integration...\n');

  // Load environment variables
  try {
    require('dotenv').config({ path: '.env.local' });
    console.log('✅ Loaded .env.local file');
  } catch (err) {
    console.log('📄 No .env.local file found, using system environment variables');
  }

  // Check environment variables
  console.log('\n1. Checking environment variables:');
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const adminEmail = process.env.ADMIN_EMAIL;

  console.log(`   SENDGRID_API_KEY: ${apiKey ? '✅ Set (starts with: ' + apiKey.substring(0, 10) + '...)' : '❌ Missing'}`);
  console.log(`   SENDGRID_FROM_EMAIL: ${fromEmail ? '✅ Set (' + fromEmail + ')' : '❌ Missing'}`);
  console.log(`   ADMIN_EMAIL: ${adminEmail ? '✅ Set (' + adminEmail + ')' : '❌ Missing'}`);

  if (!apiKey || !fromEmail) {
    console.error('\n❌ Missing required environment variables!');
    console.log('\nMake sure your .env.local file contains:');
    console.log('SENDGRID_API_KEY=SG.your-api-key-here');
    console.log('SENDGRID_FROM_EMAIL=verified@yourdomain.com');
    console.log('ADMIN_EMAIL=admin@yourdomain.com');
    return;
  }

  // Initialize SendGrid
  console.log('\n2. Initializing SendGrid:');
  try {
    sgMail.setApiKey(apiKey);
    console.log('   ✅ SendGrid API key set');
  } catch (error) {
    console.error('   ❌ Error setting API key:', error.message);
    return;
  }

  // Test welcome email
  console.log('\n3. Testing welcome email:');
  const testUserData = {
    firstName: 'John',
    lastName: 'Doe',
    email: fromEmail, // Send to your own email for testing
    accountNumber: 'TEST-' + Date.now()
  };

  const welcomeMsg = {
    to: testUserData.email,
    from: {
      email: fromEmail,
      name: 'SecureBank Test'
    },
    subject: '🧪 Test Welcome Email - SecureBank',
    text: `Test welcome email for ${testUserData.firstName} ${testUserData.lastName}. Account: ${testUserData.accountNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>🧪 Test Welcome Email</h1>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2>Hello ${testUserData.firstName} ${testUserData.lastName}!</h2>
          <p>This is a test email from SecureBank.</p>
          <p><strong>Account Number:</strong> ${testUserData.accountNumber}</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <p>If you receive this email, your SendGrid integration is working correctly! 🎉</p>
        </div>
      </div>
    `
  };

  try {
    const welcomeResult = await sgMail.send(welcomeMsg);
    console.log('   ✅ Welcome email sent successfully!');
    console.log('   Message ID:', welcomeResult[0].headers['x-message-id']);
  } catch (error) {
    console.error('   ❌ Welcome email failed:');
    if (error.response) {
      console.error('   API Response:', error.response.body);
    } else {
      console.error('   Error:', error.message);
    }
  }

  // Test admin notification
  console.log('\n4. Testing admin notification:');
  const adminMsg = {
    to: adminEmail || fromEmail,
    from: {
      email: fromEmail,
      name: 'SecureBank Test System'
    },
    subject: '🧪 Test Admin Notification - New User Registration',
    text: `Test admin notification: ${testUserData.firstName} ${testUserData.lastName} (${testUserData.email}) registered. Account: ${testUserData.accountNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>🧪 Test Admin Notification</h1>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2>New User Registration Test</h2>
          <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
            <p><strong>Name:</strong> ${testUserData.firstName} ${testUserData.lastName}</p>
            <p><strong>Email:</strong> ${testUserData.email}</p>
            <p><strong>Account Number:</strong> ${testUserData.accountNumber}</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>If you receive this email, your admin notification system is working correctly! 🎉</p>
        </div>
      </div>
    `
  };

  try {
    const adminResult = await sgMail.send(adminMsg);
    console.log('   ✅ Admin notification sent successfully!');
    console.log('   Message ID:', adminResult[0].headers['x-message-id']);
  } catch (error) {
    console.error('   ❌ Admin notification failed:');
    if (error.response) {
      console.error('   API Response:', error.response.body);
    } else {
      console.error('   Error:', error.message);
    }
  }

  console.log('\n🎉 SendGrid test completed!');
  console.log('\nCheck your email inbox (and spam folder) for the test messages.');
}

testSendGrid().catch(console.error);