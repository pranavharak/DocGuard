import mongoose from 'mongoose';
import { config } from './env.config.js';
import { SystemStatus } from '../models/system.model.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);

    console.log(`[DocuGuard Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Create an initial system status document to allocate the 'docguard' database on disk
    await SystemStatus.findOneAndUpdate(
      { serviceName: 'DocuGuard AI Forensic Engine' },
      { status: 'active', connectedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log(`[DocuGuard Database] Initialized 'docguard' database on disk.`);

    return conn;
  } catch (error) {
    console.error(`[DocuGuard Database Error] MongoDB Connection Failed: ${error.message}`);
    return null;
  }
};

// Event listeners for database connection status
mongoose.connection.on('disconnected', () => {
  console.warn('[DocuGuard Database] MongoDB connection lost');
});

mongoose.connection.on('error', (err) => {
  console.error(`[DocuGuard Database Error] Runtime error: ${err.message}`);
});

export const getDatabaseState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const stateCode = mongoose.connection.readyState;
  return {
    stateCode,
    status: states[stateCode] || 'unknown',
    isConnected: stateCode === 1,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null
  };
};
