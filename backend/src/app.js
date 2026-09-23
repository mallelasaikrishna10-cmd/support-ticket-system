const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/environment');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Request logging middleware
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Enable CORS with support for development and production environments
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, Postman, or curl)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        config.corsOrigin,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
      ];
      if (allowedOrigins.includes(origin) || config.env === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Support Ticket Management System API',
    documentation: '/api/health',
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
