import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import apiRouter from './routes/api.js';
import authRouter from './routes/auth.js';
import vaultRouter from './routes/vault.js';
import adminRouter from './routes/admin.js';
import { startThreatIntelCron } from './jobs/cron.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize Automated Threat Intelligence Cron Scheduler
startThreatIntelCron();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);
app.use('/api/auth', authRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/admin', adminRouter);

// Serve static React production build if present
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root Health Check Route
  app.get('/', (req, res) => {
    res.json({ message: 'PassCraft Node.js / Express Backend Running API' });
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`[PassCraft Server] Running on http://localhost:${PORT}`);
});
