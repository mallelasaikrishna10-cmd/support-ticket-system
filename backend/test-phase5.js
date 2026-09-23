const request = require('supertest');
const app = require('./src/app');
const { pool } = require('./src/config/database');

async function runTests() {
  console.log('========================================================');
  console.log(' PHASE 5 VERIFICATION: COMMENTS & RESPONSES REST APIS  ');
  console.log('========================================================\n');

  let aliceToken = null; // Customer user_id = 3 (owns Ticket 1, Ticket 2)
  let bobToken = null;   // Customer user_id = 4 (owns Ticket 3, Ticket 6)
  let sarahToken = null; // Agent user_id = 1
  let createdCommentId = null;

  try {
    // 0. Authenticate test users
    console.log('0. Authenticating test users...');
    const aliceRes = await request(app).post('/api/auth/login').send({
      email: 'alice.johnson@example.com',
      password: 'Password123!',
    });
    aliceToken = aliceRes.body.token;

    const bobRes = await request(app).post('/api/auth/login').send({
      email: 'bob.smith@example.com',
      password: 'Password123!',
    });
    bobToken = bobRes.body.token;

    const sarahRes = await request(app).post('/api/auth/login').send({
      email: 'agent.sarah@supportpro.com',
      password: 'Password123!',
    });
    sarahToken = sarahRes.body.token;
    console.log('   ✓ Test tokens acquired for Alice, Bob, and Agent Sarah');

    // 1. Customer can view comments on their own ticket (Ticket 2 belongs to Alice)
    console.log("\n1. Testing Customer Viewing Comments on Own Ticket (Ticket 2 - Alice)...");
    const aliceCommentsRes = await request(app)
      .get('/api/tickets/2/comments')
      .set('Authorization', `Bearer ${aliceToken}`);

    if (aliceCommentsRes.status !== 200) throw new Error(`Expected 200 OK, got ${aliceCommentsRes.status}: ${JSON.stringify(aliceCommentsRes.body)}`);
    if (!Array.isArray(aliceCommentsRes.body.comments)) throw new Error('Expected comments array');
    console.log(`   ✓ Alice successfully retrieved ${aliceCommentsRes.body.comments.length} comments for Ticket #2`);
    console.log(`   ✓ First comment author: ${aliceCommentsRes.body.comments[0].author_name} (${aliceCommentsRes.body.comments[0].author_role})`);

    // 2. Agent can view comments on any ticket (Agent Sarah views Ticket 2)
    console.log("\n2. Testing Agent Viewing Comments on Any Ticket (Ticket 2)...");
    const agentCommentsRes = await request(app)
      .get('/api/tickets/2/comments')
      .set('Authorization', `Bearer ${sarahToken}`);

    if (agentCommentsRes.status !== 200) throw new Error(`Expected 200 OK, got ${agentCommentsRes.status}`);
    console.log(`   ✓ Agent Sarah successfully retrieved comments for Ticket #2 (Count: ${agentCommentsRes.body.count})`);

    // 3. Customer cannot view comments on another customer's ticket (Alice accesses Bob's Ticket 3)
    console.log("\n3. Testing Cross-Tenant Comment Isolation (Alice -> Bob's Ticket 3)...");
    const crossViewRes = await request(app)
      .get('/api/tickets/3/comments')
      .set('Authorization', `Bearer ${aliceToken}`);

    if (crossViewRes.status !== 403) throw new Error(`Expected 403 Forbidden, got ${crossViewRes.status}`);
    console.log(`   ✓ Cross-tenant view comments blocked with 403 Forbidden: ${crossViewRes.body.message}`);

    // 4. Customer can add a comment to their own ticket (Alice comments on Ticket 1)
    console.log("\n4. Testing Customer Adding Comment to Own Ticket (Alice -> Ticket 1)...");
    const aliceAddCommentRes = await request(app)
      .post('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ comment: 'Alice update: I tried an alternate Visa card and it worked, please verify.' });

    if (aliceAddCommentRes.status !== 201) throw new Error(`Expected 201 Created, got ${aliceAddCommentRes.status}: ${JSON.stringify(aliceAddCommentRes.body)}`);
    createdCommentId = aliceAddCommentRes.body.comment.id;
    if (aliceAddCommentRes.body.comment.user_id !== 3) throw new Error(`Expected author user_id 3, got ${aliceAddCommentRes.body.comment.user_id}`);
    console.log(`   ✓ Customer comment added (201 Created), Comment ID: ${createdCommentId}, Author: ${aliceAddCommentRes.body.comment.author_name}`);

    // 5. Agent can add a comment to any ticket (Sarah comments on Ticket 1)
    console.log("\n5. Testing Agent Adding Response to Any Ticket (Sarah -> Ticket 1)...");
    const agentAddCommentRes = await request(app)
      .post('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${sarahToken}`)
      .send({ comment: 'Agent Sarah response: Payment verified successfully on our transaction gateway.' });

    if (agentAddCommentRes.status !== 201) throw new Error(`Expected 201 Created, got ${agentAddCommentRes.status}`);
    console.log(`   ✓ Agent comment added (201 Created), Author: ${agentAddCommentRes.body.comment.author_name} (${agentAddCommentRes.body.comment.author_role})`);

    // 6. Customer cannot comment on another customer's ticket (Alice comments on Bob's Ticket 3)
    console.log("\n6. Testing Customer Commenting on Another Customer's Ticket (Alice -> Bob's Ticket 3)...");
    const crossAddCommentRes = await request(app)
      .post('/api/tickets/3/comments')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ comment: 'Unauthorized comment attempt' });

    if (crossAddCommentRes.status !== 403) throw new Error(`Expected 403 Forbidden, got ${crossAddCommentRes.status}`);
    console.log(`   ✓ Cross-tenant comment attempt blocked with 403 Forbidden: ${crossAddCommentRes.body.message}`);

    // 7. Empty comment returns 400 Bad Request
    console.log("\n7. Testing Empty / Whitespace-only Comment Rejection (400 Bad Request)...");
    const emptyCommentRes = await request(app)
      .post('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ comment: '    ' });

    if (emptyCommentRes.status !== 400) throw new Error(`Expected 400 Bad Request, got ${emptyCommentRes.status}`);
    console.log(`   ✓ Empty comment rejected with 400 Bad Request: ${emptyCommentRes.body.message}`);

    // 8. Missing JWT returns 401 Unauthorized
    console.log("\n8. Testing Unauthenticated Request without JWT (401 Unauthorized)...");
    const unauthGetRes = await request(app).get('/api/tickets/1/comments');
    const unauthPostRes = await request(app).post('/api/tickets/1/comments').send({ comment: 'test' });

    if (unauthGetRes.status !== 401 || unauthPostRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated comment requests`);
    }
    console.log(`   ✓ Unauthenticated GET and POST rejected with 401 Unauthorized`);

    // 9. Non-existent ticket returns 404 Not Found
    console.log("\n9. Testing Non-Existent Ticket (404 Not Found)...");
    const notFoundGet = await request(app)
      .get('/api/tickets/99999/comments')
      .set('Authorization', `Bearer ${sarahToken}`);
    const notFoundPost = await request(app)
      .post('/api/tickets/99999/comments')
      .set('Authorization', `Bearer ${sarahToken}`)
      .send({ comment: 'Hello' });

    if (notFoundGet.status !== 404 || notFoundPost.status !== 404) {
      throw new Error(`Expected 404 for non-existent ticket comments`);
    }
    console.log(`   ✓ Non-existent ticket returned 404 Not Found: ${notFoundGet.body.message}`);

    // 10. Verify stored comment in MySQL database contains authenticated user's ID
    console.log("\n10. Verifying Database Row Integrity for Stored Comment...");
    const [dbCommentRows] = await pool.execute('SELECT id, ticket_id, user_id, comment FROM ticket_comments WHERE id = ?', [createdCommentId]);
    if (dbCommentRows.length === 0) throw new Error('Comment not found in MySQL database');
    const dbComment = dbCommentRows[0];
    if (dbComment.user_id !== 3 || dbComment.ticket_id !== 1) {
      throw new Error(`Database record integrity mismatch: user_id=${dbComment.user_id}, ticket_id=${dbComment.ticket_id}`);
    }
    console.log(`   ✓ Database record confirmed: Comment ID ${dbComment.id} is attached to Ticket 1 with User ID 3 (Alice)`);

    console.log('\n========================================================');
    console.log(' ALL 10 PHASE 5 VERIFICATION TESTS PASSED PERFECTLY!    ');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ Phase 5 Test Failure:', err.message);
    process.exit(1);
  } finally {
    // Clean up test comments inserted during test run
    if (createdCommentId) {
      await pool.execute('DELETE FROM ticket_comments WHERE id >= ?', [createdCommentId]);
    }
    await pool.end();
  }
}

runTests();
