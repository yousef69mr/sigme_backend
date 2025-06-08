import express from 'express';
// import * as fs from 'fs';
import { db } from '../../lib/database.js';
// import jwt from 'jsonwebtoken'
import { verifyToken } from '../../lib/auth.js'

const router = express.Router();

// Create DeviceInfo
router.post('/', verifyToken, async (req, res) => {
  try {
    const device = await db.deviceInfo.create({ data: req.body });
    res.json(device);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Read all devices
router.get('/', async (req, res) => {
  try {
    const devices = await db.deviceInfo.findMany();
    res.json(devices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Read one device by id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const device = await db.deviceInfo.findUnique({
      where: { id: req.params.id },
      include: { connectivityLogs: true },
    });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update device
router.put('/:id', async (req, res) => {
  try {
    const device = await db.deviceInfo.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(device);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete device
router.delete('/:id', async (req, res) => {
  try {
    await db.deviceInfo.delete({ where: { id: req.params.id } });
    res.json({ message: 'Device deleted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


export default router;