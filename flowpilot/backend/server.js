const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/error');
const WorkflowEngine = require('./engine/workflowEngine');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: process.env.CLIENT_URL || '*' }
});

const workflowEngine = new WorkflowEngine(io);
require('./controllers/executionController').setEngine(workflowEngine);

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'FlowPilot API is healthy' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workflows', require('./routes/workflowRoutes'));
app.use('/api/executions', require('./routes/executionRoutes'));
app.use('/api/steps', require('./routes/stepRoutes'));
app.use('/api/rules', require('./routes/ruleRoutes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    logger.info('MongoDB Connected');

    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Server startup error: ${error.message}`);
    process.exit(1);
  }
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
  logger.error(`Server startup error: ${error.message}`);
  process.exit(1);
});

io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  socket.on('disconnect', () => logger.info('Client disconnected'));
});

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io, startServer };
