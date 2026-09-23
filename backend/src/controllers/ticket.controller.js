const TicketModel = require('../models/ticket.model');
const UserModel = require('../models/user.model');

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

class TicketController {
  /**
   * @route   POST /api/tickets
   * @desc    Create a new support ticket
   * @access  Protected (Customer)
   */
  static async createTicket(req, res, next) {
    try {
      const { subject, description, priority } = req.body;

      // 1. Validate required fields
      if (!subject || !description || !priority) {
        return res.status(400).json({
          success: false,
          message: 'Please provide subject, description, and priority.',
        });
      }

      // 2. Validate subject length
      if (typeof subject !== 'string' || subject.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Subject must be at least 3 characters long.',
        });
      }

      // 3. Validate description length
      if (typeof description !== 'string' || description.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Description must be at least 5 characters long.',
        });
      }

      // 4. Validate priority value
      const normalizedPriority = priority.toLowerCase().trim();
      if (!VALID_PRIORITIES.includes(normalizedPriority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Valid options are: ${VALID_PRIORITIES.join(', ')}.`,
        });
      }

      // 5. Create ticket with authenticated customer's ID (user_id strictly from JWT)
      const newTicket = await TicketModel.create({
        userId: req.user.id,
        subject: subject.trim(),
        description: description.trim(),
        priority: normalizedPriority,
        status: 'open',
        assignedTo: null,
      });

      return res.status(201).json({
        success: true,
        message: 'Support ticket created successfully.',
        ticket: newTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/tickets
   * @desc    Get tickets list (Customer sees own tickets; Agent sees all tickets)
   * @access  Protected (Customer / Agent)
   */
  static async getTickets(req, res, next) {
    try {
      const filters = {};

      // 1. Role-based scoping: Customers can only see their own tickets
      if (req.user.role === 'customer') {
        filters.userId = req.user.id;
      } else if (req.user.role === 'agent') {
        // Support agents can optionally filter by customer
        if (req.query.customer_id || req.query.user_id) {
          filters.userId = parseInt(req.query.customer_id || req.query.user_id, 10);
        }
      }

      // 2. Filter by status
      if (req.query.status) {
        const normalizedStatus = req.query.status.toLowerCase().trim();
        if (VALID_STATUSES.includes(normalizedStatus)) {
          filters.status = normalizedStatus;
        }
      }

      // 3. Filter by priority
      if (req.query.priority) {
        const normalizedPriority = req.query.priority.toLowerCase().trim();
        if (VALID_PRIORITIES.includes(normalizedPriority)) {
          filters.priority = normalizedPriority;
        }
      }

      // 4. Filter by assigned agent (Agent view)
      if (req.query.assigned_to) {
        filters.assignedTo = req.query.assigned_to;
      }

      // 5. Search keyword
      if (req.query.search) {
        filters.search = req.query.search;
      }

      // 6. Sorting
      if (req.query.sort_by) {
        filters.sortBy = req.query.sort_by;
      }
      if (req.query.sort_order) {
        filters.sortOrder = req.query.sort_order;
      }

      const tickets = await TicketModel.findAll(filters);

      return res.status(200).json({
        success: true,
        count: tickets.length,
        tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/tickets/:id
   * @desc    Get single ticket details
   * @access  Protected (Customer: Own ticket only; Agent: Any ticket)
   */
  static async getTicketById(req, res, next) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      if (isNaN(ticketId) || ticketId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket ID provided.',
        });
      }

      const ticket = await TicketModel.findById(ticketId);

      // 1. Return 404 if ticket doesn't exist
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found.',
        });
      }

      // 2. Role-based Data Isolation: Customer cannot view another customer's ticket
      if (req.user.role === 'customer' && ticket.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view this ticket.',
        });
      }

      return res.status(200).json({
        success: true,
        ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/tickets/:id
   * @desc    Update ticket status, priority, assignment, or details
   * @access  Protected (Agent: status, priority, assigned_to; Customer: own ticket content)
   */
  static async updateTicket(req, res, next) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      if (isNaN(ticketId) || ticketId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket ID provided.',
        });
      }

      const existingTicket = await TicketModel.findRawById(ticketId);

      // 1. Check if ticket exists
      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found.',
        });
      }

      const updates = {};

      // 2. Customer Update Rules
      if (req.user.role === 'customer') {
        // Customer cannot modify another customer's ticket
        if (existingTicket.user_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not have permission to modify this ticket.',
          });
        }

        // Customer cannot modify agent-controlled fields
        if (req.body.assigned_to !== undefined || req.body.status !== undefined) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: Customers cannot modify ticket assignment or status directly.',
          });
        }

        if (req.body.subject !== undefined) {
          if (typeof req.body.subject !== 'string' || req.body.subject.trim().length < 3) {
            return res.status(400).json({
              success: false,
              message: 'Subject must be at least 3 characters long.',
            });
          }
          updates.subject = req.body.subject;
        }

        if (req.body.description !== undefined) {
          if (typeof req.body.description !== 'string' || req.body.description.trim().length < 5) {
            return res.status(400).json({
              success: false,
              message: 'Description must be at least 5 characters long.',
            });
          }
          updates.description = req.body.description;
        }

        if (req.body.priority !== undefined) {
          const normPriority = req.body.priority.toLowerCase().trim();
          if (!VALID_PRIORITIES.includes(normPriority)) {
            return res.status(400).json({
              success: false,
              message: `Invalid priority. Valid options are: ${VALID_PRIORITIES.join(', ')}.`,
            });
          }
          updates.priority = normPriority;
        }
      }

      // 3. Support Agent Update Rules
      if (req.user.role === 'agent') {
        if (req.body.status !== undefined) {
          const normStatus = req.body.status.toLowerCase().trim();
          if (!VALID_STATUSES.includes(normStatus)) {
            return res.status(400).json({
              success: false,
              message: `Invalid status. Valid options are: ${VALID_STATUSES.join(', ')}.`,
            });
          }
          updates.status = normStatus;
        }

        if (req.body.priority !== undefined) {
          const normPriority = req.body.priority.toLowerCase().trim();
          if (!VALID_PRIORITIES.includes(normPriority)) {
            return res.status(400).json({
              success: false,
              message: `Invalid priority. Valid options are: ${VALID_PRIORITIES.join(', ')}.`,
            });
          }
          updates.priority = normPriority;
        }

        if (req.body.assigned_to !== undefined) {
          if (req.body.assigned_to === null || req.body.assigned_to === '' || req.body.assigned_to === 0) {
            updates.assigned_to = null;
          } else {
            const agentId = parseInt(req.body.assigned_to, 10);
            if (isNaN(agentId) || agentId <= 0) {
              return res.status(400).json({
                success: false,
                message: 'Invalid agent ID for assignment.',
              });
            }

            // Verify target user is indeed an agent
            const targetUser = await UserModel.findById(agentId);
            if (!targetUser || targetUser.role !== 'agent') {
              return res.status(400).json({
                success: false,
                message: 'Assigned user must be an active support agent.',
              });
            }

            updates.assigned_to = agentId;
          }
        }

        if (req.body.subject !== undefined) {
          updates.subject = req.body.subject;
        }

        if (req.body.description !== undefined) {
          updates.description = req.body.description;
        }
      }

      // 4. Ensure at least one valid field was provided to update
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid update fields provided.',
        });
      }

      const updatedTicket = await TicketModel.update(ticketId, updates);

      return res.status(200).json({
        success: true,
        message: 'Ticket updated successfully.',
        ticket: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/tickets/:id
   * @desc    Delete a support ticket
   * @access  Protected (Agent only)
   */
  static async deleteTicket(req, res, next) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      if (isNaN(ticketId) || ticketId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket ID provided.',
        });
      }

      // 1. Role-based check: Only agents may delete tickets
      if (req.user.role !== 'agent') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only support agents have permission to delete tickets.',
        });
      }

      const existingTicket = await TicketModel.findRawById(ticketId);
      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found.',
        });
      }

      await TicketModel.delete(ticketId);

      return res.status(200).json({
        success: true,
        message: 'Ticket deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TicketController;
