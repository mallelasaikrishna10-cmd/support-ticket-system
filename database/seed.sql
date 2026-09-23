-- ==============================================================================
-- Support Ticket Management System - Seed Data Script
-- Assessment Source of Truth: Junior Full Stack Developer Technical Assessment
-- ==============================================================================

USE support_ticket_db;

-- Clear existing data (in dependency order)
DELETE FROM ticket_comments;
DELETE FROM tickets;
DELETE FROM users;

-- Reset Auto Increment counters
ALTER TABLE ticket_comments AUTO_INCREMENT = 1;
ALTER TABLE tickets AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- ------------------------------------------------------------------------------
-- 1. SEED USERS
-- All seed accounts use secure bcrypt hash with 10 salt rounds for password: 'Password123!'
-- Hash: $2b$10$cvzt3SurfnCuqB7lIUuH1udxBxYoFlf39a7HP7QNtPGB6AqXw7NkK
-- ------------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES
-- Support Agents (id: 1, 2)
(1, 'Sarah Connor', 'agent.sarah@supportpro.com', '$2b$10$cvzt3SurfnCuqB7lIUuH1udxBxYoFlf39a7HP7QNtPGB6AqXw7NkK', 'agent', '2026-09-01 08:00:00'),
(2, 'David Miller', 'agent.david@supportpro.com', '$2b$10$cvzt3SurfnCuqB7lIUuH1udxBxYoFlf39a7HP7QNtPGB6AqXw7NkK', 'agent', '2026-09-01 08:30:00'),

-- Customers (id: 3, 4, 5, 6)
(3, 'Alice Johnson', 'alice.johnson@example.com', '$2b$10$cvzt3SurfnCuqB7lIUuH1udxBxYoFlf39a7HP7QNtPGB6AqXw7NkK', 'customer', '2026-09-05 09:15:00'),
(4, 'Bob Smith', 'bob.smith@example.com', '$2b$10$cvzt3SurfnCuqB7lIUuH1udxBxYoFlf39a7HP7QNtPGB6AqXw7NkK', 'customer', '2026-09-08 11:20:00'),
(5, 'Charlie Davis', 'charlie.davis@example.com', '$2b$10$cvzt3SurfnCuqB7lIUuH1udxBxYoFlf39a7HP7QNtPGB6AqXw7NkK', 'customer', '2026-09-12 14:05:00'),
(6, 'Emma Watson', 'emma.watson@example.com', '$2b$10$cvzt3SurfnCuqB7lIUuH1udxBxYoFlf39a7HP7QNtPGB6AqXw7NkK', 'customer', '2026-09-15 16:45:00');

-- ------------------------------------------------------------------------------
-- 2. SEED TICKETS
-- Varied statuses ('open', 'in_progress', 'resolved', 'closed')
-- Varied priorities ('low', 'medium', 'high', 'urgent')
-- Includes both assigned and unassigned tickets
-- ------------------------------------------------------------------------------
INSERT INTO tickets (id, user_id, subject, description, priority, status, assigned_to, created_at, updated_at) VALUES
-- Ticket 1: Urgent, Open, Unassigned (Customer: Alice)
(1, 3, 'Unable to process payment for invoice #10492', 'I am trying to complete payment for my quarterly subscription via credit card, but the checkout keeps timing out with error code ERR_GATEWAY_TIMEOUT.', 'urgent', 'open', NULL, '2026-09-20 10:14:00', '2026-09-20 10:14:00'),

-- Ticket 2: Low, Resolved, Assigned to Sarah (Customer: Alice)
(2, 3, 'Feature request: Export ticket history to PDF', 'It would be really helpful for our compliance team if we could export full ticket conversation histories directly into a formatted PDF file.', 'low', 'resolved', 1, '2026-09-18 11:00:00', '2026-09-19 16:30:00'),

-- Ticket 3: High, In Progress, Assigned to David (Customer: Bob)
(3, 4, 'API Rate Limiting threshold reached unexpectedly', 'Our automated sync process failed this morning due to 429 Too Many Requests, although our request rate is well within the 100 req/min quota.', 'high', 'in_progress', 2, '2026-09-21 09:25:00', '2026-09-21 11:40:00'),

-- Ticket 4: High, Open, Assigned to Sarah (Customer: Charlie)
(4, 5, 'SSO integration redirect loop on Chrome', 'When logging in via Okta SSO on Google Chrome version 128, the page enters an infinite redirect loop between the auth provider and callback URL.', 'high', 'open', 1, '2026-09-22 08:50:00', '2026-09-22 10:00:00'),

-- Ticket 5: Medium, Closed, Assigned to David (Customer: Emma)
(5, 6, 'Incorrect billing address on recent invoice', 'The invoice generated on September 1st has our old office address instead of the updated primary billing address listed on our account profile.', 'medium', 'closed', 2, '2026-09-16 13:10:00', '2026-09-17 15:20:00'),

-- Ticket 6: Medium, Open, Unassigned (Customer: Bob)
(6, 4, 'Dashboard metrics not loading in Safari', 'The analytics dashboard charts remain blank when accessed using Apple Safari on macOS Sonoma.', 'medium', 'open', NULL, '2026-09-22 15:30:00', '2026-09-22 15:30:00');

-- ------------------------------------------------------------------------------
-- 3. SEED TICKET COMMENTS
-- Realistic conversation threads involving customers and agents
-- ------------------------------------------------------------------------------
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at) VALUES
-- Comments on Ticket 2 (Resolved)
(1, 2, 1, 'Thank you for the suggestion Alice! Our product team has reviewed this feature request and scheduled it for our Q4 release roadmap.', '2026-09-18 14:20:00'),
(2, 2, 3, 'That is great news, thank you Sarah for the prompt update!', '2026-09-19 09:10:00'),
(3, 2, 1, 'Marking this ticket as resolved. Feel free to reply if you need any further assistance.', '2026-09-19 16:30:00'),

-- Comments on Ticket 3 (In Progress)
(4, 3, 2, 'Hi Bob, I have analyzed our API gateway telemetry and noticed a burst of 140 requests in a 10-second window. I am currently adjusting your rate-limiter bucket burst tolerance.', '2026-09-21 10:15:00'),
(5, 3, 4, 'Thanks David! We will throttle our retry logic on our end as well while you adjust the gateway.', '2026-09-21 11:40:00'),

-- Comments on Ticket 4 (Open)
(6, 4, 1, 'Hello Charlie, could you please confirm if clearing cookies and site data resolves the issue, or if third-party cookies are blocked in Chrome settings?', '2026-09-22 10:00:00');

-- ==============================================================================
-- 4. ASSESSMENT SECTION 8: REQUIRED DEMONSTRATION QUERY
-- "Write a query that returns all open tickets along with the customer's name and email.
--  The query should demonstrate use of a JOIN and filtering."
-- ==============================================================================
SELECT 
    t.id AS ticket_id,
    t.subject,
    t.description,
    t.priority,
    t.status,
    t.assigned_to,
    t.created_at,
    u.id AS customer_id,
    u.name AS customer_name,
    u.email AS customer_email
FROM 
    tickets t
INNER JOIN 
    users u ON t.user_id = u.id
WHERE 
    t.status = 'open'
ORDER BY 
    t.created_at DESC;
