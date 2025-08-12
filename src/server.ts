import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { Container } from './application/infrastructure/dependecy-injection/container';
import { UserController } from './application/infrastructure/web/controllers/UserController'; // Add your controllers

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Apply middleware FIRST
app.use(express.json());
app.use(cors());
app.use(helmet());

const container = new Container();

// Register your existing routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the FlowynDesk API',
    version: '1.0.0'
  });
});

// Register decorator-based routes AFTER middleware
const userController = new UserController(container);
container.registerRoutes(app, [userController]);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit(0);
});