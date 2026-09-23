const CommentModel = require('../models/comment.model');
const TicketModel = require('../models/ticket.model');

class CommentController {
  /**
   * @route   GET /api/tickets/:id/comments
   * @desc    Get all comments for a ticket in chronological order
   * @access  Protected (Customer: own ticket only; Agent: any ticket)
   */
  static async getComments(req, res, next) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      if (isNaN(ticketId) || ticketId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket ID provided.',
        });
      }

      // 1. Verify ticket exists
      const ticket = await TicketModel.findRawById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found.',
        });
      }

      // 2. Customer access isolation: customer can only view comments on their own ticket
      if (req.user.role === 'customer' && ticket.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view comments for this ticket.',
        });
      }

      // 3. Fetch chronological comments
      const comments = await CommentModel.findByTicketId(ticketId);

      return res.status(200).json({
        success: true,
        count: comments.length,
        comments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/tickets/:id/comments
   * @desc    Add a comment/response to a ticket
   * @access  Protected (Customer: own ticket only; Agent: any ticket)
   */
  static async createComment(req, res, next) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      if (isNaN(ticketId) || ticketId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket ID provided.',
        });
      }

      const { comment } = req.body;

      // 1. Validate comment presence and non-empty content
      if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment text is required and cannot be empty.',
        });
      }

      // 2. Verify ticket exists
      const ticket = await TicketModel.findRawById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found.',
        });
      }

      // 3. Customer access isolation: customer can only comment on their own ticket
      if (req.user.role === 'customer' && ticket.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to comment on this ticket.',
        });
      }

      // 4. Save comment using authenticated user's ID from JWT (never trust client user_id)
      const newComment = await CommentModel.create({
        ticketId,
        userId: req.user.id,
        comment: comment.trim(),
      });

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully.',
        comment: newComment,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CommentController;
