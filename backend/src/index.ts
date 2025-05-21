import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import allRoutes from './routes';
import { connectDB } from './config/db';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow only this origin
  credentials: true, // If you want to allow cookies/auth headers
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('API is running!');
});

app.use('/api',allRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, async() => {
  await connectDB()
  console.log(`Server is running on http://localhost:${PORT}`);
});
