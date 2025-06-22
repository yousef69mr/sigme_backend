import express from 'express';
import { db } from '../lib/database.js';
import { verifyToken } from '../lib/auth.js';
import { UserRole } from '@prisma/client';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: AlertMode
 *     description: Manage alert modes
 */

/**
 * @swagger
 * /api/alert-modes:
 *   post:
 *     summary: Create a new alert mode (Admin only)
 *     tags: [AlertMode]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - label
 *             properties:
 *               key:
 *                 type: string
 *                 example: silent
 *               label:
 *                 type: string
 *                 example: Silent Mode
 *               description:
 *                 type: string
 *                 example: No sound or vibration
 *     responses:
 *       201:
 *         description: Alert mode created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, async (req, res) => {
    const user = req.user;
    if (user.role !== UserRole.ADMIN) return res.status(403).json({ message: 'Forbidden' });

    const { key, label, description } = req.body;
    if (!key || !label) return res.status(400).json({ message: 'key and label are required' });

    try {
        const alertMode = await db.alertMode.create({ data: { key, label, description } });
        res.status(201).json(alertMode);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /api/alert-modes:
 *   get:
 *     summary: Get all alert modes
 *     tags: [AlertMode]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of alert modes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AlertMode'
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
    try {
        const modes = await db.alertMode.findMany();
        res.json(modes);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /api/alert-modes/{id}:
 *   get:
 *     summary: Get an alert mode by ID
 *     tags: [AlertMode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: AlertMode ID
 *     responses:
 *       200:
 *         description: Alert mode found
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const mode = await db.alertMode.findUnique({ where: { id: req.params.id } });
        if (!mode) return res.status(404).json({ message: 'Not found' });
        res.json(mode);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /api/alert-modes/{id}:
 *   patch:
 *     summary: Update an alert mode (Admin only)
 *     tags: [AlertMode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               label:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', verifyToken, async (req, res) => {
    const user = req.user;
    if (user.role !== UserRole.ADMIN) return res.status(403).json({ message: 'Forbidden' });

    try {
        const existing = await db.alertMode.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ message: 'Not found' });

        const updated = await db.alertMode.update({
            where: { id: req.params.id },
            data: { ...req.body },
        });

        res.json(updated);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /api/alert-modes/{id}:
 *   delete:
 *     summary: Delete an alert mode (Admin only)
 *     description: |
 *       Deletes an alert mode by its ID.
 *       - Only admins are allowed to delete.
 *       - Deletion is forbidden if:
 *         - The record is the first created alert mode.
 *         - It is the last remaining alert mode.
 *     tags:
 *       - AlertMode
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the alert mode to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert mode deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Alert mode deleted
 *                 deleted:
 *                   $ref: '#/components/schemas/AlertMode'
 *       400:
 *         description: Cannot delete the last remaining alert mode.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cannot delete the last remaining alert mode.
 *       403:
 *         description: Forbidden – either not admin or trying to delete protected record.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forbidden - Cannot delete the first alert mode.
 *       500:
 *         description: Internal server error.
 */

router.delete('/:id', verifyToken, async (req, res) => {
    const user = req.user;
    if (user.role !== UserRole.ADMIN) return res.status(403).json({ message: 'Forbidden' });

    try {

        // Find the first (earliest) inserted AlertMode
        const firstRecord = await db.alertMode.findFirst({
            orderBy: { createdAt: 'asc' }
        });

        if (firstRecord && firstRecord.id === id) {
            return res.status(403).json({ message: 'Cannot delete the first alert mode.' });
        }

        const totalCount = await db.alertMode.count();
        if (totalCount <= 1) {
            return res.status(400).json({ message: 'Cannot delete the last remaining alert mode.' });
        }

        const deleted = await db.alertMode.delete({ where: { id: req.params.id } });
        res.json({ message: 'Alert mode deleted', deleted });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

export default router;
