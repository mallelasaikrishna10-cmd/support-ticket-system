const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticket.controller');
const CommentController = require('../controllers/comment.controller');
const authenticateToken = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorize.middleware');

// All ticket routes require authentication
router.use(authenticateToken);

// --------------------------------------------------------------------------
// Ticket Management Routes
// --------------------------------------------------------------------------

// 1. GET /api/tickets - List tickets (Customer sees own; Agent sees all)
router.get('/', TicketController.getTickets);

// 2. POST /api/tickets - Create ticket (Customer / Agent)
router.post('/', authorizeRoles('customer', 'agent'), TicketController.createTicket);

// 3. GET /api/tickets/:id - Get single ticket details
router.get('/:id', TicketController.getTicketById);

// 4. PUT /api/tickets/:id - Update ticket (Status, priority, assignment)
router.put('/:id', TicketController.updateTicket);

// 5. DELETE /api/tickets/:id - Delete ticket (Agent only)
router.delete('/:id', authorizeRoles('agent'), TicketController.deleteTicket);

// --------------------------------------------------------------------------
// Ticket Comment & Response Routes
// --------------------------------------------------------------------------

// 6. GET /api/tickets/:id/comments - Get comments for a ticket
router.get('/:id/comments', CommentController.getComments);

// 7. POST /api/tickets/:id/comments - Add comment/response to a ticket
router.post('/:id/comments', CommentController.createComment);

module.exports = router;
