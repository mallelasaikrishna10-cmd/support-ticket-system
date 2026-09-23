const request = require('supertest');
const app = require('./src/app');
const { pool } = require('./src/config/database');

async function runTests() {
  console.log('========================================================');
  console.log(' PHASE 4 VERIFICATION: TICKET MANAGEMENT REST APIS     ');
  console.log('========================================================\n');

  let aliceToken = null;
  let bobToken = null;
  let sarahAgentToken = null;
  let createdTicketId = null;

  try {
    // 0. Login seeded users (Alice: Customer id=3, Bob: Customer id=4, Sarah: Agent id=1)
    console.log('0. Authenticating test users...');
    const aliceLogin = await request(app).post('/api/auth/login').send({
      email: 'alice.johnson@example.com',
      password: 'Password123!',
    });
    aliceToken = aliceLogin.body.token;

    const bobLogin = await request(app).post('/api/auth/login').send({
      email: 'bob.smith@example.com',
      password: 'Password123!',
    });
    bobToken = bobLogin.body.token;

    const sarahLogin = await request(app).post('/api/auth/login').send({
      email: 'agent.sarah@supportpro.com',
      password: 'Password123!',
    });
    sarahAgentToken = sarahLogin.body.token;
    console.log('   ✓ Test tokens acquired for Alice (Customer), Bob (Customer), and Sarah (Agent)');

    // 1. Customer creates ticket successfully
    console.log('\n1. Testing Customer Ticket Creation (POST /api/tickets)...');
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        subject: 'Phase 4 Test Ticket: Checkout Failure',
        description: 'Unable to process checkout on cart page with credit card.',
        priority: 'high',
      });

    if (createRes.status !== 201) throw new Error(`Create ticket failed: ${JSON.stringify(createRes.body)}`);
    if (!createRes.body.ticket || !createRes.body.ticket.id) throw new Error('No ticket object returned');
    createdTicketId = createRes.body.ticket.id;
    if (createRes.body.ticket.user_id !== 3) throw new Error(`User ID mismatch: expected 3, got ${createRes.body.ticket.user_id}`);
    if (createRes.body.ticket.status !== 'open') throw new Error(`Expected default status 'open', got ${createRes.body.ticket.status}`);
    console.log(`   ✓ Ticket created successfully (201 Created), ID: ${createdTicketId}, Status: ${createRes.body.ticket.status}`);

    // 2. Customer gets their own tickets
    console.log('\n2. Testing Customer Fetching Own Tickets (GET /api/tickets)...');
    const aliceTicketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${aliceToken}`);

    if (aliceTicketsRes.status !== 200) throw new Error(`Fetch tickets failed: ${aliceTicketsRes.status}`);
    const nonAliceTickets = aliceTicketsRes.body.tickets.filter((t) => t.user_id !== 3);
    if (nonAliceTickets.length > 0) throw new Error('Data leak: Alice received tickets belonging to other customers!');
    console.log(`   ✓ Alice retrieved ${aliceTicketsRes.body.tickets.length} tickets (all strictly belong to user_id 3)`);

    // 3. Customer cannot get another customer's ticket (403 Forbidden)
    console.log("\n3. Testing Cross-Tenant Isolation: Alice accessing Bob's Ticket #3 (GET /api/tickets/3)...");
    const crossAccessRes = await request(app)
      .get('/api/tickets/3')
      .set('Authorization', `Bearer ${aliceToken}`);

    if (crossAccessRes.status !== 403) throw new Error(`Expected 403 Forbidden, got ${crossAccessRes.status}`);
    console.log(`   ✓ Cross-tenant access blocked with 403 Forbidden: ${crossAccessRes.body.message}`);

    // 4. Agent can get all tickets across the system
    console.log('\n4. Testing Agent Fetching All System Tickets (GET /api/tickets)...');
    const agentTicketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${sarahAgentToken}`);

    if (agentTicketsRes.status !== 200) throw new Error(`Agent fetch tickets failed: ${agentTicketsRes.status}`);
    if (agentTicketsRes.body.tickets.length < 6) throw new Error(`Expected at least 6 tickets, got ${agentTicketsRes.body.tickets.length}`);
    console.log(`   ✓ Agent retrieved all system tickets (Total: ${agentTicketsRes.body.count})`);

    // 5. Agent can get any ticket by ID
    console.log("\n5. Testing Agent Fetching Any Customer's Ticket (GET /api/tickets/3)...");
    const agentGetBobTicket = await request(app)
      .get('/api/tickets/3')
      .set('Authorization', `Bearer ${sarahAgentToken}`);

    if (agentGetBobTicket.status !== 200) throw new Error(`Agent failed to get ticket 3: ${agentGetBobTicket.status}`);
    console.log(`   ✓ Agent retrieved Bob's Ticket #3: "${agentGetBobTicket.body.ticket.subject}"`);

    // 6. Agent can update ticket status
    console.log(`\n6. Testing Agent Updating Ticket Status to 'in_progress' on Ticket #${createdTicketId}...`);
    const statusUpdateRes = await request(app)
      .put(`/api/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${sarahAgentToken}`)
      .send({ status: 'in_progress' });

    if (statusUpdateRes.status !== 200) throw new Error(`Agent status update failed: ${JSON.stringify(statusUpdateRes.body)}`);
    if (statusUpdateRes.body.ticket.status !== 'in_progress') throw new Error(`Expected status 'in_progress', got ${statusUpdateRes.body.ticket.status}`);
    console.log(`   ✓ Agent updated ticket status to: ${statusUpdateRes.body.ticket.status}`);

    // 7. Agent can update ticket priority
    console.log(`\n7. Testing Agent Updating Ticket Priority to 'urgent' on Ticket #${createdTicketId}...`);
    const priorityUpdateRes = await request(app)
      .put(`/api/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${sarahAgentToken}`)
      .send({ priority: 'urgent' });

    if (priorityUpdateRes.status !== 200) throw new Error(`Agent priority update failed: ${JSON.stringify(priorityUpdateRes.body)}`);
    if (priorityUpdateRes.body.ticket.priority !== 'urgent') throw new Error(`Expected priority 'urgent', got ${priorityUpdateRes.body.ticket.priority}`);
    console.log(`   ✓ Agent updated ticket priority to: ${priorityUpdateRes.body.ticket.priority}`);

    // 8. Agent can assign a ticket to an agent (Sarah assigns to David: agent id 2)
    console.log(`\n8. Testing Agent Assigning Ticket #${createdTicketId} to Agent David (id: 2)...`);
    const assignUpdateRes = await request(app)
      .put(`/api/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${sarahAgentToken}`)
      .send({ assigned_to: 2 });

    if (assignUpdateRes.status !== 200) throw new Error(`Agent assignment failed: ${JSON.stringify(assignUpdateRes.body)}`);
    if (assignUpdateRes.body.ticket.assigned_to !== 2) throw new Error(`Expected assigned_to 2, got ${assignUpdateRes.body.ticket.assigned_to}`);
    console.log(`   ✓ Agent assigned ticket to David Miller (assigned_agent_name: ${assignUpdateRes.body.ticket.assigned_agent_name})`);

    // 9. Invalid ticket ID returns 404
    console.log('\n9. Testing Non-Existent Ticket ID (GET /api/tickets/99999)...');
    const notFoundRes = await request(app)
      .get('/api/tickets/99999')
      .set('Authorization', `Bearer ${sarahAgentToken}`);

    if (notFoundRes.status !== 404) throw new Error(`Expected 404 Not Found, got ${notFoundRes.status}`);
    console.log(`   ✓ Non-existent ticket returned 404: ${notFoundRes.body.message}`);

    // 10. Invalid input returns 400
    console.log('\n10. Testing Invalid Input on Ticket Creation (Missing priority & short subject)...');
    const invalidInputRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        subject: 'ab',
        description: 'short',
      });

    if (invalidInputRes.status !== 400) throw new Error(`Expected 400 Bad Request, got ${invalidInputRes.status}`);
    console.log(`   ✓ Invalid input rejected with 400 Bad Request: ${invalidInputRes.body.message}`);

    // 11. Missing JWT returns 401
    console.log('\n11. Testing Unauthenticated Request without JWT (GET /api/tickets)...');
    const unauthRes = await request(app).get('/api/tickets');
    if (unauthRes.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`);
    console.log(`   ✓ Unauthenticated request rejected with 401: ${unauthRes.body.message}`);

    // 12. Customer cannot perform agent-only operations (Customer tries to change assigned_to or delete ticket)
    console.log('\n12. Testing Customer Attempting Agent-Only Operations (Assigning agent & Deleting ticket)...');
    const custAssignRes = await request(app)
      .put(`/api/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ assigned_to: 1 });

    if (custAssignRes.status !== 403) throw new Error(`Expected 403 Forbidden on customer assignment, got ${custAssignRes.status}`);
    console.log(`   ✓ Customer assignment attempt blocked with 403: ${custAssignRes.body.message}`);

    const custDeleteRes = await request(app)
      .delete(`/api/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    if (custDeleteRes.status !== 403) throw new Error(`Expected 403 Forbidden on customer delete, got ${custDeleteRes.status}`);
    console.log(`   ✓ Customer delete attempt blocked with 403: ${custDeleteRes.body.message}`);

    // 13. Agent deletes ticket successfully
    console.log(`\n13. Testing Agent Ticket Deletion (DELETE /api/tickets/${createdTicketId})...`);
    const agentDeleteRes = await request(app)
      .delete(`/api/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${sarahAgentToken}`);

    if (agentDeleteRes.status !== 200) throw new Error(`Agent delete failed: ${JSON.stringify(agentDeleteRes.body)}`);
    console.log(`   ✓ Agent deleted ticket successfully (200 OK): ${agentDeleteRes.body.message}`);

    console.log('\n========================================================');
    console.log(' ALL 13 VERIFICATION TESTS PASSED PERFECTLY!            ');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ Phase 4 Test Failure:', err.message);
    process.exit(1);
  } finally {
    if (createdTicketId) {
      await pool.execute('DELETE FROM tickets WHERE id = ?', [createdTicketId]);
    }
    await pool.end();
  }
}

runTests();
