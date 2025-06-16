import express from 'express';
// import * as fs from 'fs';
import { db } from '../../lib/database.js';
// import jwt from 'jsonwebtoken'
import { verifyToken } from '../../lib/auth.js'

const router = express.Router();

// Create mobileNetworkInfo
router.post('/', verifyToken, async (req, res) => {
  try {
    const mobileNetworkInfo = await db.mo.create({ data: req.body });
    res.json(mobileNetworkInfo);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Read all mobileNetworks
router.get('/', async (req, res) => {
  try {
    const mobileNetworks = await db.mobileNetworkInfo.findMany();
    res.json(mobileNetworks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Read one mobileNetworkInfo by id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const mobileNetworkInfo = await db.mobileNetworkInfo.findUnique({
      where: { id: req.params.id },
      include: { connectivityLogs: true },
    });
    if (!mobileNetworkInfo) return res.status(404).json({ error: 'mobile network info not found' });
    res.json(mobileNetworkInfo);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update mobileNetworkInfo
router.put('/:id', async (req, res) => {
  try {
    const mobileNetworkInfo = await db.mobileNetworkInfo.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(mobileNetworkInfo);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete mobileNetworkInfo
router.delete('/:id', async (req, res) => {
  try {
    await db.mobileNetworkInfo.delete({ where: { id: req.params.id } });
    res.json({ message: 'mobile network info deleted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


export default router;