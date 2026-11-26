const express = require('express');
const cors = require('cors');
const bookRoutes = require('./routes/bookRoutes');
const loanRoutes = require('./routes/loanRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { sendSuccess, sendError } = require('./utils/apiResponse');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  return sendSuccess(res, 200, 'Library Book Lending Manager API is running', {
    status: 'ok',
  });
});

app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/stats', statsRoutes);

// Handle malformed JSON bodies
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'Invalid JSON payload');
  }
  return next(err);
});

// 404 handler for unknown API routes
app.use((req, res) => {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
});

module.exports = app;
