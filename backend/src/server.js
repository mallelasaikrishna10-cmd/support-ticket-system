const app = require('./app');
const config = require('./config/environment');
const { testConnection } = require('./config/database');

const PORT = config.port;

const startServer = async () => {
  // Test MySQL connection on startup
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.warn('⚠️ Warning: Database connection failed. Please check MySQL server and .env settings.');
  }

  const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Support Ticket Management System Backend`);
    console.log(` Environment: ${config.env}`);
    console.log(` Server Port: ${PORT}`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection! Shutting down server...', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception! Shutting down server...', err);
    process.exit(1);
  });
};

startServer();
