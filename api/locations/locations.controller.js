import express from 'express';
// import * as fs from 'fs';
import { db } from '../../lib/database.js';
// import jwt from 'jsonwebtoken'
import { verifyToken } from '../../lib/auth.js'

const router = express.Router();


// Create Location
router.post('/', verifyToken, async (req, res) => {
    try {
        const location = await db.location.create({ data: req.body });
        res.json(location);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Read all locations
router.get('/', async (req, res) => {
    try {
        const locations = await db.location.findMany();
        res.json(locations);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Read one location by id
router.get('/:id', async (req, res) => {
    try {
        const location = await db.location.findUnique({ where: { id: req.params.id } });
        if (!location) return res.status(404).json({ error: 'Location not found' });
        res.json(location);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update location
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const location = await db.location.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(location);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Delete location
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await db.location.delete({ where: { id: req.params.id } });
        res.json({ message: 'Location deleted' });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

export default router;