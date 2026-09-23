const { pool } = require('../config/database');

/**
 * User Data Access Layer / Model
 * Uses parameterized queries to prevent SQL injection.
 */
class UserModel {
  /**
   * Find a user by email address
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, name, email, password_hash, role, created_at
      FROM users
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [email.trim()]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find a user by ID (excluding password_hash by default)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new customer user
   * @param {Object} userData
   * @param {string} userData.name
   * @param {string} userData.email
   * @param {string} userData.passwordHash
   * @param {string} [userData.role='customer']
   * @returns {Promise<Object>}
   */
  static async create({ name, email, passwordHash, role = 'customer' }) {
    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      name.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      role,
    ]);

    return {
      id: result.insertId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
    };
  }

  /**
   * List all support agents (for ticket assignment in later phase)
   * @returns {Promise<Array>}
   */
  static async findAllAgents() {
    const query = `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE role = 'agent'
      ORDER BY name ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }
}

module.exports = UserModel;
