import { getDatabaseState } from '../config/db.config.js';
import { SystemStatus } from '../models/system.model.js';

// GET /api/health
export const getHealthStatus = (req, res) => {
  const dbStatus = getDatabaseState();

  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'DocuGuard AI Forensic Engine is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: dbStatus
  });
};

// GET /api/health/db (Dedicated Test Route to verify & initialize MongoDB database)
export const getDatabaseHealth = async (req, res) => {
  const dbStatus = getDatabaseState();

  if (dbStatus.isConnected) {
    try {
      // Writing a record ensures MongoDB allocates the 'docguard' database on disk
      const testEntry = await SystemStatus.create({
        serviceName: 'DocuGuard AI Forensic Engine',
        status: 'active',
        connectedAt: new Date()
      });

      return res.status(200).json({
        success: true,
        message: 'MongoDB database connection is active and test record inserted into docguard db',
        database: dbStatus,
        initializationRecord: testEntry
      });
    } catch (err) {
      return res.status(200).json({
        success: true,
        message: 'MongoDB database connected',
        database: dbStatus,
        error: err.message
      });
    }
  }

  return res.status(503).json({
    success: false,
    message: 'MongoDB database connection is not active',
    database: dbStatus
  });
};
