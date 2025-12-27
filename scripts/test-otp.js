/**
 * OTP Email Verification Test Script
 * Tests the complete OTP flow: send OTP -> verify OTP
 * 
 * Usage: node scripts/test-otp.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'programmerbhai28@gmail.com';

async function testOtpFlow() {
  console.log('🧪 OTP Email Verification Test\n');
  console.log(`📍 API URL: ${BASE_URL}`);
  console.log(`📧 Test Email: ${TEST_EMAIL}\n`);

  // Step 1: Send OTP
  console.log('Step 1: Sending OTP...');
  try {
    const sendResponse = await fetch(`${BASE_URL}/auth/send-verification-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });

    const sendData = await sendResponse.json();
    
    if (!sendResponse.ok) {
      console.log(`❌ Failed to send OTP: ${sendData.message || sendResponse.statusText}`);
      console.log('   Response:', JSON.stringify(sendData, null, 2));
      
      if (sendData.message?.includes('already verified')) {
        console.log('\n✅ Email is already verified - OTP flow working correctly!');
        return;
      }
      return;
    }

    console.log(`✅ OTP sent successfully!`);
    console.log(`   Response: ${JSON.stringify(sendData)}`);
    console.log('\n📬 Check your email for the OTP code.');
    console.log('   (Also check server logs for the OTP if email delivery fails)\n');

    // Step 2: Verify OTP (manual input)
    console.log('Step 2: To verify OTP, run:');
    console.log(`   curl -X POST ${BASE_URL}/auth/verify-email \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"email": "${TEST_EMAIL}", "otp": "YOUR_OTP_HERE"}'`);
    console.log('\n   Or use the interactive test below:\n');

    // Interactive OTP verification
    await interactiveVerify();

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.cause?.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Make sure your backend server is running on port 3001');
    }
  }
}

async function interactiveVerify() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter OTP (or press Enter to skip): ', async (otp) => {
    rl.close();
    
    if (!otp || otp.trim() === '') {
      console.log('⏭️  Skipped OTP verification');
      return;
    }

    console.log(`\nVerifying OTP: ${otp}...`);
    
    try {
      const verifyResponse = await fetch(`${BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, otp: otp.trim() }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok) {
        console.log('✅ Email verified successfully!');
        console.log(`   Response: ${JSON.stringify(verifyData)}`);
      } else {
        console.log(`❌ Verification failed: ${verifyData.message}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  });
}

// Run the test
testOtpFlow();
