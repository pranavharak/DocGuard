import { Router } from 'express';
import { getHealthStatus, getDatabaseHealth } from '../controllers/health.controller.js';

const router = Router();

// GET /api/health
router.get('/', getHealthStatus);

// GET /api/health/db (Dedicated test route to verify MongoDB connection)
router.get('/db', getDatabaseHealth);

export default router;
