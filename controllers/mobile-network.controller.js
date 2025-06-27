import express from 'express';
import { db } from '../lib/database.js';
import { verifyToken } from '../lib/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MobileNetworkInfo
 *   description: Manage mobile network signal records
 */

/**
 * @swagger
 * /api/mobile-network:
 *   post:
 *     summary: Create a new mobile network info entry
 *     tags: [MobileNetworkInfo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               carrier:
 *                 type: string
 *                 example: Vodafone
 *               networkType:
 *                 type: string
 *                 example: 4G
 *               signalLevel:
 *                 type: integer
 *                 example: 2
 *               signalDbm:
 *                 type: integer
 *                 example: -92
 *               mcc:
 *                 type: string
 *                 example: "602"
 *               mnc:
 *                 type: string
 *                 example: "01"
 *               asuLevel:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Mobile network info created
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 */
router.post('/', verifyToken, async (req, res) => {
  const user = req.user;

  if (!user) return res.status(401).json({ message: "unauthorized !!" });
  try {
    const mobileNetworkInfo = await db.mobileNetworkInfo.create({ data: req.body });
    res.json(mobileNetworkInfo);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/mobile-network:
 *   get:
 *     summary: Get all mobile network info entries
 *     tags: [MobileNetworkInfo]
 *     responses:
 *       200:
 *         description: A list of mobile network info
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    const mobileNetworks = await db.mobileNetworkInfo.findMany();
    res.json(mobileNetworks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/mobile-network/{id}:
 *   get:
 *     summary: Get mobile network info by ID
 *     tags: [MobileNetworkInfo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mobile network info ID
 *     responses:
 *       200:
 *         description: Mobile network info found
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/mobile-network/{id}:
 *   put:
 *     summary: Update mobile network info
 *     tags: [MobileNetworkInfo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mobile network info ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               carrier:
 *                 type: string
 *               networkType:
 *                 type: string
 *               signalLevel:
 *                 type: integer
 *               signalDbm:
 *                 type: integer
 *               mcc:
 *                 type: string
 *               mnc:
 *                 type: string
 *               asuLevel:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Mobile network info updated
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', verifyToken, async (req, res) => {
  const user = req.user;

  if (!user) return res.status(401).json({ message: "unauthorized !!" });

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

/**
 * @swagger
 * /api/mobile-network/{id}:
 *   delete:
 *     summary: Delete mobile network info
 *     tags: [MobileNetworkInfo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mobile network info ID
 *     responses:
 *       200:
 *         description: Mobile network info deleted
 *       400:
 *         description: Deletion failed
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', verifyToken, async (req, res) => {
  const user = req.user;

  if (!user) return res.status(401).json({ message: "unauthorized !!" });

  try {
    await db.mobileNetworkInfo.delete({ where: { id: req.params.id } });
    res.json({ message: 'mobile network info deleted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
