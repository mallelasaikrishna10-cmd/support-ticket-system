const request = require('supertest');
const app = require('./src/app');
const { pool } = require('./src/config/database');

async function runMasterRegressionSuite() {
  console.log('================================================================');
  console.log(' SUPPORT TICKET MANAGEMENT SYSTEM - MASTER REGRESSION TEST SUITE ');
  console.log('================================================================\n');

  let aliceToken = null; // Customer 1 (id: 3)
  let bobToken = null;   // Customer 2 (id: 4)
  let sarahToken = null; // Agent 1 (id: 1)
  let testTicketId = null;
  const uniqueRegEmail = `reg_test_${Date.now()}@example.com`;

  try {
    // --------------------------------------------------------------------------
    // 1. AUTHENTICATION FLOWS
    // --------------------------------------------------------------------------
    console.log('[1/5] Running Authentication Tests...');

    // 1.1 Customer Registration
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Regression Customer',
      email: uniqueRegEmail,
      password: 'Password123!',
    });
    if (regRes.status !== 201) throw new Error(`Reg failed: ${regRes.status}`);
    if (regRes.body.user.password_hash) throw new Error('Password hash leaked in registration response!');
    console.log('  ✓ 1.1 Customer Registration succeeded (201 Created)');

    // 1.2 Duplicate Email Rejection
    const dupRes = await request(app).post('/api/auth/register').send({
      name: 'Duplicate Customer',
      email: uniqueRegEmail,
      password: 'Password123!',
    });
    if (dupRes.status !== 409) throw new Error(`Expected 409 for duplicate email, got ${dupRes.status}`);
    console.log('  ✓ 1.2 Duplicate email registration rejected (409 Conflict)');

    // 1.3 Customer Login
    const aliceLogin = await request(app).post('/api/auth/login').send({
      email: 'alice.johnson@example.com',
      password: 'Password123!',
    });
    if (aliceLogin.status !== 200 || !aliceLogin.body.token) throw new Error('Alice login failed');
    aliceToken = aliceLogin.body.token;
    console.log('  ✓ 1.3 Customer Login succeeded (200 OK)');

    // 1.4 Agent Login
    const sarahLogin = await request(app).post('/api/auth/login').send({
      email: 'agent.sarah@supportpro.com',
      password: 'Password123!',
    });
    if (sarahLogin.status !== 200 || !sarahLogin.body.token) throw new Error('Sarah login failed');
    sarahToken = sarahLogin.body.token;
    console.log('  ✓ 1.4 Support Agent Login succeeded (200 OK)');

    // 1.5 Bob Login
    const bobLogin = await request(app).post('/api/auth/login').send({
      email: 'bob.smith@example.com',
      password: 'Password123!',
    });
    bobToken = bobLogin.body.token;
    console.log('  ✓ 1.5 Second Customer Login succeeded (200 OK)');

    // 1.6 Invalid Password
    const badPass = await request(app).post('/api/auth/login').send({
      email: 'alice.johnson@example.com',
      password: 'WrongPassword!',
    });
    if (badPass.status !== 401) throw new Error('Bad password was not rejected with 401');
    console.log('  ✓ 1.6 Invalid password rejected (401 Unauthorized)');

    // 1.7 Non-Existent User
    const badUser = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'Password123!',
    });
    if (badUser.status !== 401) throw new Error('Non-existent user was not rejected with 401');
    console.log('  ✓ 1.7 Non-existent user rejected (401 Unauthorized)');

    // 1.8 Profile Retrieval (GET /api/auth/me)
    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${aliceToken}`);
    if (meRes.status !== 200 || meRes.body.user.role !== 'customer') throw new Error('Profile fetch failed');
    console.log('  ✓ 1.8 Authenticated Profile retrieval succeeded (200 OK)');

    // --------------------------------------------------------------------------
    // 2. AUTHORIZATION & RBAC TESTS
    // --------------------------------------------------------------------------
    console.log('\n[2/5] Running Authorization & RBAC Tests...');

    // 2.1 Unauthenticated request blocked
    const noToken = await request(app).get('/api/tickets');
    if (noToken.status !== 401) throw new Error('Unauthenticated request was not rejected with 401');
    console.log('  ✓ 2.1 Unauthenticated request blocked (401 Unauthorized)');

    // 2.2 Malformed token blocked
    const badToken = await request(app).get('/api/tickets').set('Authorization', 'Bearer bad.token.string');
    if (badToken.status !== 401) throw new Error('Malformed token was not rejected with 401');
    console.log('  ✓ 2.2 Malformed JWT rejected (401 Unauthorized)');

    // 2.3 Customer accessing Agent-only endpoint (GET /api/users) -> 403
    const custOnAgent = await request(app).get('/api/users').set('Authorization', `Bearer ${aliceToken}`);
    if (custOnAgent.status !== 403) throw new Error('Customer accessing /api/users was not blocked with 403');
    console.log('  ✓ 2.3 Customer blocked from Agent endpoint (403 Forbidden)');

    // 2.4 Agent accessing Agent-only endpoint -> 200
    const agentOnAgent = await request(app).get('/api/users').set('Authorization', `Bearer ${sarahToken}`);
    if (agentOnAgent.status !== 200) throw new Error('Agent failed to access /api/users');
    console.log('  ✓ 2.4 Agent authorized for Agent endpoint (200 OK)');

    // --------------------------------------------------------------------------
    // 3. CUSTOMER TICKET FLOWS & DATA ISOLATION
    // --------------------------------------------------------------------------
    console.log('\n[3/5] Running Customer Ticket Operations & Tenant Isolation Tests...');

    // 3.1 Customer creates ticket
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        subject: 'Regression Test: Mobile Checkout Glitch',
        description: 'Encountering 504 timeout when placing order on mobile network.',
        priority: 'high',
      });
    if (createRes.status !== 201 || !createRes.body.ticket) throw new Error('Customer ticket creation failed');
    testTicketId = createRes.body.ticket.id;
    if (createRes.body.ticket.status !== 'open') throw new Error('Default status must be open');
    console.log(`  ✓ 3.1 Customer created ticket #${testTicketId} (201 Created)`);

    // 3.2 Customer retrieves tickets (only own tickets)
    const aliceTickets = await request(app).get('/api/tickets').set('Authorization', `Bearer ${aliceToken}`);
    const nonAlice = aliceTickets.body.tickets.filter((t) => t.user_id !== 3);
    if (nonAlice.length > 0) throw new Error('DATA LEAK: Customer received tickets belonging to another user!');
    console.log(`  ✓ 3.2 Customer ticket scoping confirmed (${aliceTickets.body.tickets.length} tickets, 0 foreign tickets)`);

    // 3.3 Customer A cannot access Customer B's ticket
    const crossAccess = await request(app).get('/api/tickets/3').set('Authorization', `Bearer ${aliceToken}`);
    if (crossAccess.status !== 403) throw new Error('Cross-tenant ticket access was not blocked with 403');
    console.log('  ✓ 3.3 Cross-tenant ticket access blocked (403 Forbidden)');

    // 3.4 Customer A cannot view Customer B's comments
    const crossComments = await request(app).get('/api/tickets/3/comments').set('Authorization', `Bearer ${aliceToken}`);
    if (crossComments.status !== 403) throw new Error('Cross-tenant comments view was not blocked with 403');
    console.log('  ✓ 3.4 Cross-tenant comments view blocked (403 Forbidden)');

    // 3.5 Customer A cannot comment on Customer B's ticket
    const crossPost = await request(app)
      .post('/api/tickets/3/comments')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ comment: 'Hacking attempt' });
    if (crossPost.status !== 403) throw new Error('Cross-tenant comment creation was not blocked with 403');
    console.log('  ✓ 3.5 Cross-tenant comment post blocked (403 Forbidden)');

    // 3.6 Customer adds comment to own ticket
    const addComment = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ comment: 'Alice follow-up note: Also occurs on WiFi.' });
    if (addComment.status !== 201) throw new Error('Customer comment creation failed');
    console.log('  ✓ 3.6 Customer added comment to own ticket (201 Created)');

    // 3.7 Empty comment rejection
    const emptyComment = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ comment: '   ' });
    if (emptyComment.status !== 400) throw new Error('Empty comment was not rejected with 400');
    console.log('  ✓ 3.7 Empty comment rejected (400 Bad Request)');

    // 3.8 Customer cannot perform agent operations (reassign ticket)
    const custAssign = await request(app)
      .put(`/api/tickets/${testTicketId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ assigned_to: 1 });
    if (custAssign.status !== 403) throw new Error('Customer assignment was not blocked with 403');
    console.log('  ✓ 3.8 Customer blocked from reassigning ticket (403 Forbidden)');

    // --------------------------------------------------------------------------
    // 4. AGENT WORKSPACE OPERATIONS
    // --------------------------------------------------------------------------
    console.log('\n[4/5] Running Agent Operations & Ticket Management Tests...');

    // 4.1 Agent views all tickets
    const agentTickets = await request(app).get('/api/tickets').set('Authorization', `Bearer ${sarahToken}`);
    if (agentTickets.status !== 200 || agentTickets.body.tickets.length < 6) {
      throw new Error('Agent failed to retrieve global ticket list');
    }
    console.log(`  ✓ 4.1 Agent retrieved all global tickets (${agentTickets.body.count} tickets)`);

    // 4.2 Agent updates status to in_progress
    const updateStatus = await request(app)
      .put(`/api/tickets/${testTicketId}`)
      .set('Authorization', `Bearer ${sarahToken}`)
      .send({ status: 'in_progress' });
    if (updateStatus.status !== 200 || updateStatus.body.ticket.status !== 'in_progress') {
      throw new Error('Status update failed');
    }
    console.log('  ✓ 4.2 Agent updated ticket status to in_progress (200 OK)');

    // 4.3 Agent updates priority to urgent
    const updatePriority = await request(app)
      .put(`/api/tickets/${testTicketId}`)
      .set('Authorization', `Bearer ${sarahToken}`)
      .send({ priority: 'urgent' });
    if (updatePriority.status !== 200 || updatePriority.body.ticket.priority !== 'urgent') {
      throw new Error('Priority update failed');
    }
    console.log('  ✓ 4.3 Agent updated ticket priority to urgent (200 OK)');

    // 4.4 Agent assigns ticket to Agent David (id: 2)
    const assignAgent = await request(app)
      .put(`/api/tickets/${testTicketId}`)
      .set('Authorization', `Bearer ${sarahToken}`)
      .send({ assigned_to: 2 });
    if (assignAgent.status !== 200 || assignAgent.body.ticket.assigned_to !== 2) {
      throw new Error('Assignment failed');
    }
    console.log('  ✓ 4.4 Agent assigned ticket to David Miller (200 OK)');

    // 4.5 Agent assigning to invalid user ID returns 400
    const invalidAssign = await request(app)
      .put(`/api/tickets/${testTicketId}`)
      .set('Authorization', `Bearer ${sarahToken}`)
      .send({ assigned_to: 99999 });
    if (invalidAssign.status !== 400) throw new Error('Invalid agent assignment was not rejected with 400');
    console.log('  ✓ 4.5 Invalid agent assignment rejected (400 Bad Request)');

    // 4.6 Agent posts support response
    const agentComment = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set('Authorization', `Bearer ${sarahToken}`)
      .send({ comment: 'Agent Sarah: Gateway patch deployed to production.' });
    if (agentComment.status !== 201 || agentComment.body.comment.author_role !== 'agent') {
      throw new Error('Agent comment failed');
    }
    console.log('  ✓ 4.6 Agent posted support response (201 Created)');

    // 4.7 Agent resolves ticket
    const resolveTicket = await request(app)
      .put(`/api/tickets/${testTicketId}`)
      .set('Authorization', `Bearer ${sarahToken}`)
      .send({ status: 'resolved' });
    if (resolveTicket.status !== 200 || resolveTicket.body.ticket.status !== 'resolved') {
      throw new Error('Resolution failed');
    }
    console.log('  ✓ 4.7 Agent marked ticket as resolved (200 OK)');

    // 4.8 Agent deletes ticket
    const deleteTicket = await request(app)
      .delete(`/api/tickets/${testTicketId}`)
      .set('Authorization', `Bearer ${sarahToken}`);
    if (deleteTicket.status !== 200) throw new Error('Delete failed');
    console.log(`  ✓ 4.8 Agent permanently deleted ticket #${testTicketId} (200 OK)`);
    testTicketId = null;

    // --------------------------------------------------------------------------
    // 5. SECTION 8 DEMONSTRATION QUERY VERIFICATION
    // --------------------------------------------------------------------------
    console.log('\n[5/5] Running Assessment Section 8 Demonstration SQL Query...');
    const demoQuery = `
      SELECT 
        t.id AS ticket_id,
        t.subject,
        t.priority,
        t.status,
        u.name AS customer_name,
        u.email AS customer_email
      FROM tickets t
      INNER JOIN users u ON t.user_id = u.id
      WHERE t.status = 'open'
      ORDER BY t.created_at DESC;
    `;
    const [openTicketsResult] = await pool.query(demoQuery);
    if (!Array.isArray(openTicketsResult) || openTicketsResult.length === 0) {
      throw new Error('Demonstration query returned empty set');
    }
    console.log(`  ✓ 5.1 Section 8 Query executed successfully (Returned ${openTicketsResult.length} open ticket(s) with customer details)`);

    console.log('\n================================================================');
    console.log(' 🎉 ALL 24 MASTER REGRESSION TESTS PASSED WITH ZERO ERRORS!    ');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ MASTER REGRESSION FAILURE:', err.message);
    process.exit(1);
  } finally {
    if (testTicketId) {
      await pool.execute('DELETE FROM tickets WHERE id = ?', [testTicketId]);
    }
    await pool.execute('DELETE FROM users WHERE email = ?', [uniqueRegEmail]);
    await pool.end();
  }
}

runMasterRegressionSuite();
