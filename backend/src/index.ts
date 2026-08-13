import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import employeesRouter from './routes/employees';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: true,           // reflect any origin (dev only)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/employees', employeesRouter);

app.listen(PORT, () => {
  console.log(`🚀 HRIS Backend running on http://localhost:${PORT}`);
});

export default app;
