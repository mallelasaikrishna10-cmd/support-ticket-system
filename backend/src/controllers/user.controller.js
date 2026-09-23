const UserModel = require('../models/user.model');

class UserController {
  /**
   * @route   GET /api/users
   * @desc    Get support agents list (for ticket assignment)
   * @access  Protected (Agent only)
   */
  static async getUsers(req, res, next) {
    try {
      const agents = await UserModel.findAllAgents();
      return res.status(200).json({
        success: true,
        count: agents.length,
        users: agents,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
