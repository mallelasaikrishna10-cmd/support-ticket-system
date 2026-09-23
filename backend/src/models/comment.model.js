const { pool } = require('../config/database');

/**
 * Comment Data Access Layer / Model
 * Uses parameterized queries to prevent SQL injection.
 */
class CommentModel {
  /**
   * Add a new comment to a ticket
   * @param {Object} data
   * @param {number} data.ticketId
   * @param {number} data.userId
   * @param {string} data.comment
   * @returns {Promise<Object>}
   */
  static async create({ ticketId, userId, comment }) {
    const query = `
      INSERT INTO ticket_comments (ticket_id, user_id, comment)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      ticketId,
      userId,
      comment.trim(),
    ]);

    return this.findById(result.insertId);
  }

  /**
   * Find a comment by ID with author details
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `
      SELECT 
        c.id,
        c.ticket_id,
        c.user_id,
        c.comment,
        c.created_at,
        u.name AS author_name,
        u.email AS author_email,
        u.role AS author_role
      FROM ticket_comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find all comments for a ticket in chronological order
   * @param {number} ticketId
   * @returns {Promise<Array>}
   */
  static async findByTicketId(ticketId) {
    const query = `
      SELECT 
        c.id,
        c.ticket_id,
        c.user_id,
        c.comment,
        c.created_at,
        u.name AS author_name,
        u.email AS author_email,
        u.role AS author_role
      FROM ticket_comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC, c.id ASC
    `;
    const [rows] = await pool.execute(query, [ticketId]);
    return rows;
  }
}

module.exports = CommentModel;
