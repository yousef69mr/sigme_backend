import express from 'express';
// import * as fs from 'fs';
import { db } from '../../lib/database.js';
// import jwt from 'jsonwebtoken'
import { verifyToken } from '../../lib/auth.js'

const router = express.Router();


// Create ConnectivityInfo
router.post('/', verifyToken, async (req, res) => {
    try {
        const connectivity = await db.connectivityInfo.create({
            data: req.body,
            include: { location: true, device: true },
        });
        res.json(connectivity);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Read all connectivity logs
router.get('/', async (req, res) => {
    try {
        const connectivityLogs = await db.connectivityInfo.findMany({
            include: { location: true, device: true },
        });
        res.json(connectivityLogs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Read one connectivity log by id
router.get('/:id', async (req, res) => {
    try {
        const connectivity = await db.connectivityInfo.findUnique({
            where: { id: req.params.id },
            include: { location: true, device: true },
        });
        if (!connectivity) return res.status(404).json({ error: 'Connectivity log not found' });
        res.json(connectivity);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update connectivity log
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const connectivity = await db.connectivityInfo.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(connectivity);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Delete connectivity log
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await db.connectivityInfo.delete({ where: { id: req.params.id } });
        res.json({ message: 'Connectivity log deleted' });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

export default router;