const request = require('supertest');
const app = require('./src/app');
const { pool } = require('./src/config/database');

async function runTests() {
  console.log('========================================================');
  console.log(' PHASE 3 VERIFICATION: AUTHENTICATION & AUTHORIZATION  ');
  console.log('========================================================\n');

  let customerToken = null;
  let agentToken = null;
  const testEmail = `customer_${Date.now()}@testdomain.com`;
  const testPassword = 'Password123!';

  try {
    // 1. Test POST /api/auth/register (Success)
    console.log('1. Testing Customer Registration...');
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Customer',
        email: testEmail,
        password: testPassword,
      });

    if (regRes.status !== 201) throw new Error(`Registration failed with status ${regRes.status}: ${JSON.stringify(regRes.body)}`);
    if (!regRes.body.token) throw new Error('Registration did not return a JWT token');
    if (regRes.body.user.password_hash || regRes.body.user.password) throw new Error('Password hash leaked in response!');
    if (regRes.body.user.role !== 'customer') throw new Error(`Expected role 'customer', got '${regRes.body.user.role}'`);
    console.log('   ✓ Customer registration succeeded (201 Created)');
    console.log(`   ✓ Token received, password hash hidden, role is: ${regRes.body.user.role}`);

    // 2. Test duplicate email rejection
    console.log('\n2. Testing Duplicate Email Registration Rejection...');
    const dupRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: testEmail,
        password: 'AnotherPassword123!',
      });

    if (dupRes.status !== 409 && dupRes.status !== 400) {
      throw new Error(`Expected 409 or 400 for duplicate email, got ${dupRes.status}`);
    }
    console.log(`   ✓ Duplicate email rejected (${dupRes.status}): ${dupRes.body.message}`);

    // 3. Verify password is saved as bcrypt hash in MySQL
    console.log('\n3. Verifying Password Hash in MySQL Database...');
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE email = ?', [testEmail]);
    if (rows.length === 0) throw new Error('User not found in MySQL database');
    const storedHash = rows[0].password_hash;
    if (!storedHash.startsWith('$2a$') && !storedHash.startsWith('$2b$')) {
      throw new Error(`Invalid bcrypt hash format: ${storedHash}`);
    }
    if (storedHash === testPassword) throw new Error('CRITICAL: Plain text password stored in database!');
    console.log('   ✓ Verified password is stored as bcrypt hash in MySQL');

    // 4. Test Customer Login (Valid credentials)
    console.log('\n4. Testing Customer Login (Valid Credentials)...');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    if (loginRes.status !== 200) throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
    if (!loginRes.body.token) throw new Error('Login did not return a JWT token');
    customerToken = loginRes.body.token;
    console.log('   ✓ Customer login succeeded (200 OK)');
    console.log('   ✓ Valid JWT received');

    // 5. Test Login (Invalid password)
    console.log('\n5. Testing Login with Invalid Password...');
    const invalidPassRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword999!',
      });

    if (invalidPassRes.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${invalidPassRes.status}`);
    console.log(`   ✓ Invalid password rejected (401 Unauthorized): ${invalidPassRes.body.message}`);

    // 6. Test Login (Non-existent user)
    console.log('\n6. Testing Login with Non-Existent User...');
    const nonExistentRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'does_not_exist@example.com',
        password: 'Password123!',
      });

    if (nonExistentRes.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${nonExistentRes.status}`);
    console.log(`   ✓ Non-existent user rejected (401 Unauthorized): ${nonExistentRes.body.message}`);

    // 7. Test Protected Route without token
    console.log('\n7. Testing Protected Route without Token...');
    const noTokenRes = await request(app).get('/api/auth/me');
    if (noTokenRes.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${noTokenRes.status}`);
    console.log(`   ✓ Request without token rejected (401 Unauthorized): ${noTokenRes.body.message}`);

    // 8. Test Protected Route with invalid token
    console.log('\n8. Testing Protected Route with Invalid Token...');
    const invalidTokenRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.jwt.token.string');
    if (invalidTokenRes.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${invalidTokenRes.status}`);
    console.log(`   ✓ Request with invalid token rejected (401 Unauthorized): ${invalidTokenRes.body.message}`);

    // 9. Test Protected Route with valid Customer token (GET /api/auth/me)
    console.log('\n9. Testing GET /api/auth/me with Valid Customer Token...');
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    if (meRes.status !== 200) throw new Error(`Expected 200 OK, got ${meRes.status}`);
    if (meRes.body.user.email !== testEmail) throw new Error(`User mismatch in profile: ${meRes.body.user.email}`);
    console.log(`   ✓ Authenticated user profile retrieved: ${meRes.body.user.name} (${meRes.body.user.role})`);

    // 10. Test Agent Login with Seeded Agent Credentials
    console.log('\n10. Testing Support Agent Login (Seeded account)...');
    const agentLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'agent.sarah@supportpro.com',
        password: 'Password123!',
      });

    if (agentLoginRes.status !== 200) throw new Error(`Agent login failed: ${JSON.stringify(agentLoginRes.body)}`);
    agentToken = agentLoginRes.body.token;
    if (agentLoginRes.body.user.role !== 'agent') throw new Error(`Expected agent role, got ${agentLoginRes.body.user.role}`);
    console.log(`   ✓ Agent Sarah login succeeded (200 OK), role: ${agentLoginRes.body.user.role}`);

    // 11. Test Role-Based Authorization: Customer accessing Agent-only route (403 Forbidden)
    console.log('\n11. Testing Role Authorization: Customer hitting Agent-Only endpoint...');
    const customerAgentRes = await request(app)
      .get('/api/auth/agent-only')
      .set('Authorization', `Bearer ${customerToken}`);

    if (customerAgentRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for customer, got ${customerAgentRes.status}`);
    }
    console.log(`   ✓ Customer blocked with 403 Forbidden: ${customerAgentRes.body.message}`);

    // 12. Test Role-Based Authorization: Agent accessing Agent-only route (200 OK)
    console.log('\n12. Testing Role Authorization: Agent hitting Agent-Only endpoint...');
    const agentAgentRes = await request(app)
      .get('/api/auth/agent-only')
      .set('Authorization', `Bearer ${agentToken}`);

    if (agentAgentRes.status !== 200) {
      throw new Error(`Expected 200 OK for agent, got ${agentAgentRes.status}`);
    }
    console.log(`   ✓ Agent authorized successfully (200 OK): ${agentAgentRes.body.message}`);

    console.log('\n========================================================');
    console.log(' ALL 12 VERIFICATION TESTS PASSED SUCCESSFULLY!         ');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err.message);
    process.exit(1);
  } finally {
    // Clean up temporary customer from database
    await pool.execute('DELETE FROM users WHERE email = ?', [testEmail]);
    await pool.end();
  }
}

runTests();
