const winston = require('winston');

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'developer-social-platform' },
  transports: [
    
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, 
      maxFiles: 5,
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Helper functions for different log levels
const logHelper = {
  dev: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },

  // Always log errors
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },

  // Info logs
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },

  // Warning logs
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },

  // Debug logs 
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(message, meta);
    }
  },

  // Request logs
  request: (req, message = 'API Request') => {
    const sanitizedReq = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?._id ? '***' : undefined,
    };
    
    logger.info(message, { request: sanitizedReq });
  },

  // Database operation logs
  db: (operation, collection, meta = {}) => {
    logger.info(`DB ${operation}`, { 
      collection, 
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  // Socket logs
  socket: (event, userId, meta = {}) => {
    logger.info(`Socket ${event}`, { 
      userId: userId ? '***' : undefined,
      ...meta 
    });
  }
};

module.exports = { logger, logHelper };
