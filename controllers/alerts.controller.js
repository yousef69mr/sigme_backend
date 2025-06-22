import express from 'express';
import { db } from '../lib/database.js';
import { verifyToken } from '../lib/auth.js'
import { AlertStatus } from '@prisma/client'

const router = express.Router();
/**
 * @swagger
 * /api/alerts/{id}/confirm:
 *   post:
 *     summary: Confirm a manual alert and trigger the configured action
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Alert ID to confirm
 *     responses:
 *       200:
 *         description: Alert confirmed and action triggered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Alert confirmed and action triggered
 *                 alert:
 *                   $ref: '#/components/schemas/Alert'
 *       400:
 *         description: Alert already handled
 *       404:
 *         description: Alert not found or access denied
 *       500:
 *         description: Server error
 */

/**
 * Confirm a manual alert for the authenticated user and perform the configured action (e.g., send SMS/email).
 *
 * @route POST /api/alerts/:id/confirm
 * @access Private (requires bearer token)
 * @param {string} id - The alert ID
 * @returns {object} - JSON response with updated alert and action status
 */

router.post('/:id/confirm', verifyToken, async (req, res) => {
    const user = req.user;
    const { id } = req.params;

    try {
        const alert = await db.alert.findUnique({
            where: { id },
            include: {
                user: true,
                device: true
            }
        });

        if (!alert || alert.userId !== user.id) {
            return res.status(404).json({ message: 'Alert not found or access denied' });
        }

        if (alert.status !== AlertStatus.PENDING) {
            return res.status(400).json({ message: 'Alert already handled' });
        }

        const updatedAlert = await db.alert.update({
            where: { id },
            data: {
                status: AlertStatus.CONFIRMED,
                resolvedAt: new Date()
            }
        });

        console.log(`Triggering action for confirmed alert ${alert.id}`);

        await sendEmail(alert.user.email, `Confirmed Alert: ${alert.message}`);

        res.json({ message: 'Alert confirmed and action triggered', alert: updatedAlert });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});


/**
 * @swagger
 * /api/alerts/{id}/dismiss:
 *   post:
 *     summary: Dismiss a manual alert without triggering any action
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Alert ID to dismiss
 *     responses:
 *       200:
 *         description: Alert dismissed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Alert dismissed
 *                 alert:
 *                   $ref: '#/components/schemas/Alert'
 *       400:
 *         description: Alert already handled
 *       404:
 *         description: Alert not found or access denied
 *       500:
 *         description: Server error
 */

/**
 * Dismiss a manual alert for the authenticated user without taking further action.
 *
 * @route POST /api/alerts/:id/dismiss
 * @access Private (requires bearer token)
 * @param {string} id - The alert ID
 * @returns {object} - JSON response with updated alert and dismissal status
 */

router.post('/:id/dismiss', verifyToken, async (req, res) => {
    const user = req.user;
    const { id } = req.params;

    try {
        const alert = await db.alert.findUnique({ where: { id } });

        if (!alert || alert.userId !== user.id) {
            return res.status(404).json({ message: 'Alert not found or access denied' });
        }

        if (alert.status !== AlertStatus.PENDING) {
            return res.status(400).json({ message: 'Alert already handled' });
        }

        const updatedAlert = await db.alert.update({
            where: { id },
            data: {
                status: AlertStatus.DISMISSED,
                resolvedAt: new Date()
            }
        });

        res.json({ message: 'Alert dismissed', alert: updatedAlert });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



export default router;
