import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import apiRouter from './routes/api.js';
import authRouter from './routes/auth.js';
import vaultRouter from './routes/vault.js';
import adminRouter from './routes/admin.js';
import { startThreatIntelCron } from './jobs/cron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize Automated Threat Intelligence Cron Scheduler
startThreatIntelCron();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRouter);
app.use('/api/auth', authRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/admin', adminRouter);

// Root Health Check Route
app.get('/', (req, res) => {
  res.json({ message: 'PassCraft Node.js / Express Backend Running API' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[PassCraft Server] Running on http://localhost:${PORT}`);
});
