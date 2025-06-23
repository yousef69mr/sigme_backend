import express from 'express';
import { db } from '../lib/database.js';
import { verifyToken } from '../lib/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: Location management
 */

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create a new location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 30.0444
 *               longitude:
 *                 type: number
 *                 example: 31.2357
 *               accuracy:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: Location created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, async (req, res) => {
    const user = req.user;

    if (!user) return res.status(401).json({ message: "unauthorized !!" });

    try {
        const location = await db.location.create({ data: req.body });
        res.json(location);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: List of locations
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
    try {
        const locations = await db.location.findMany({
            include: { connectivityLogs: true }
        });
        res.json(locations);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get a location by ID
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location object
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
    try {
        const location = await db.location.findUnique({
            where: { id: req.params.id },
            include: { connectivityLogs: true }
        });
        if (!location) return res.status(404).json({ error: 'Location not found' });
        res.json(location);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Update a location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               accuracy:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:id', verifyToken, async (req, res) => {
    const user = req.user;

    if (!user) return res.status(401).json({ message: "unauthorized !!" });

    try {
        const location = await db.location.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(location);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Delete a location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deleted
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', verifyToken, async (req, res) => {
    const user = req.user;

    if (!user) return res.status(401).json({ message: "unauthorized !!" });

    try {
        await db.location.delete({ where: { id: req.params.id } });
        res.json({ message: 'Location deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
