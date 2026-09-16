const express = require('express');
const cors = require('cors');

const requestLogger = require('./middleware/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const agentRoutes = require('./routes/agentRoutes');
const sopRoutes = require('./routes/sopRoutes');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(requestLogger);
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/sops', sopRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
