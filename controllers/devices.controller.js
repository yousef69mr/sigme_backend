import express from 'express';
// import * as fs from 'fs';
import { db } from '../lib/database.js';
// import jwt from 'jsonwebtoken'
import { verifyToken } from '../lib/auth.js'

const router = express.Router();

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Create a new device information record
 *     tags:
 *       - DeviceInfo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *             properties:
 *               platform:
 *                 type: string
 *                 example: "Android"
 *               model:
 *                 type: string
 *                 example: "Pixel 5"
 *               brand:
 *                 type: string
 *                 example: "Google"
 *               manufacturer:
 *                 type: string
 *                 example: "Google"
 *               systemName:
 *                 type: string
 *                 example: "Android"
 *               systemVersion:
 *                 type: string
 *                 example: "12"
 *               sdkInt:
 *                 type: integer
 *                 example: 31
 *               isPhysicalDevice:
 *                 type: boolean
 *                 example: true
 *               deviceId:
 *                 type: string
 *                 example: "abc123xyz"
 *               userAgent:
 *                 type: string
 *                 example: "Mozilla/5.0 (Linux; Android 12...)"
 *               hardwareConcurrency:
 *                 type: integer
 *                 example: 8
 *               deviceMemory:
 *                 type: number
 *                 example: 4
 *     responses:
 *       201:
 *         description: Device information created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeviceInfo'
 *       400:
 *         description: Missing required field(s)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: platform is missing !!
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error message
 */
router.post('/', verifyToken, async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const {
    platform,
    model,
    brand,
    manufacturer,
    systemName,
    systemVersion,
    sdkInt,
    isPhysicalDevice,
    deviceId,
    userAgent,
    hardwareConcurrency,
    deviceMemory
  } = req.body;

  if (!platform) {
    return res.status(400).json({ message: "platform is missing" });
  }

  try {
    const device = await db.deviceInfo.create({
      data: {
        platform,
        model,
        brand,
        manufacturer,
        systemName,
        systemVersion,
        sdkInt,
        isPhysicalDevice,
        deviceId,
        userAgent,
        hardwareConcurrency,
        deviceMemory,
        user: { connect: { id: user.id } },
      }
    });

    res.status(201).json(device);
  } catch (e) {
    console.error('Device creation error:', e);
    res.status(500).json({ error: e.message });
  }
});


/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get all devices (Admin only)
 *     tags:
 *       - DeviceInfo
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all devices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceInfo'
 *       401:
 *         description: Unauthorized (only accessible by admin)
 */

// Read all devices
router.get('/', verifyToken, async (req, res) => {

  const user = req.user;

  if (user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const devices = await db.deviceInfo.findMany();
    res.json(devices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/devices/user-devices:
 *   get:
 *     summary: Get devices associated with the authenticated user
 *     tags:
 *       - DeviceInfo
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's devices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceInfo'
 *       401:
 *         description: Unauthorized (invalid token or not logged in)
 */
router.get('/user-devices', verifyToken, async (req, res) => {

  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const devices = await db.deviceInfo.findMany({
      where: {
        userId: user.id
      }
    });
    res.json(devices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/devices/{deviceId}:
 *   get:
 *     summary: Get a specific device by ID (User or Admin)
 *     tags:
 *       - DeviceInfo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the device to retrieve
 *     responses:
 *       200:
 *         description: Device details with connectivity logs
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/DeviceInfo'
 *                 - type: object
 *                   properties:
 *                     connectivityLogs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ConnectivityLog'
 *       401:
 *         description: Unauthorized (not owner or not admin)
 *       404:
 *         description: Device not found
 */
router.get('/:deviceId', verifyToken, async (req, res) => {
  const user = req.user;
  const { deviceId } = req.params;

  const isMyDevice = await db.deviceInfo.findFirst({
    where: {
      id: deviceId,
      userId: user.id
    },
    include: { connectivityLogs: true },
  });

  if (!isMyDevice && user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

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


/**
 * @swagger
 * /api/devices/{deviceId}:
 *   patch:
 *     summary: Update a device's information (must be owner or admin)
 *     tags:
 *       - DeviceInfo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *             example:
 *               model: "Updated Model"
 *               systemVersion: "13"
 *     responses:
 *       200:
 *         description: Successfully updated device
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeviceInfo'
 *       401:
 *         description: Unauthorized or invalid token
 *       404:
 *         description: Device not found for this user
 *       500:
 *         description: Server error
 */
router.patch('/:deviceId', verifyToken, async (req, res) => {
  const user = req.user;
  const { deviceId } = req.params;

  if (!user && user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Find the device linked to this user and deviceId
    const existingDevice = await db.deviceInfo.findFirst({
      where: {
        deviceId: deviceId,
        userId: user.id,
      },
    });

    if (!existingDevice) {
      return res.status(404).json({ message: 'Device not found for this user' });
    }

    const updatedDevice = await db.deviceInfo.update({
      where: { id: existingDevice.id },
      data: {
        ...req.body, // Accept any updatable field
        updatedAt: new Date(),
      },
    });

    res.json(updatedDevice);
  } catch (e) {
    console.error('Device update error:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/devices/{deviceId}:
 *   delete:
 *     summary: Delete a device (must be owner or admin)
 *     tags:
 *       - DeviceInfo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID to delete
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Device deleted
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Deletion failed
 */
router.delete('/:deviceId', verifyToken, async (req, res) => {

  const user = req.user;
  const { deviceId } = req.params;

  if (!user && user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    await db.deviceInfo.delete({ where: { id: deviceId } });
    res.json({ message: 'Device deleted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


export default router;