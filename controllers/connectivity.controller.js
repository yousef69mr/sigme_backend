import express from 'express';
// import * as fs from 'fs';
import { db } from '../lib/database.js';
// import jwt from 'jsonwebtoken'
import { verifyToken } from '../lib/auth.js'
import { getOrCreateFuzzyLocation } from '../lib/helpers/coordinates.js';
import { UserRole } from '@prisma/client';

const router = express.Router();

/**
 * @swagger
 * /api/connectivity:
 *   post:
 *     summary: Create a new connectivity log
 *     tags: [Connectivity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connectivityType
 *               - deviceId
 *             properties:
 *               connectivityType:
 *                 type: string
 *                 example: wifi
 *               deviceId:
 *                 type: string
 *                 example: 665a7cc0cf8a973db4fcce4c
 *               isConnected:
 *                 type: boolean
 *                 example: true
 *               ipAddress:
 *                 type: string
 *                 example: 192.168.0.105
 *               wifiName:
 *                 type: string
 *                 example: HomeNetwork
 *               wifiBSSID:
 *                 type: string
 *                 example: 00:1A:2B:3C:4D:5E
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 30.0444196
 *                   longitude:
 *                     type: number
 *                     example: 31.2357116
 *                   accuracy:
 *                     type: number
 *                     example: 10
 *               mobileNetworkInfo:
 *                 type: object
 *                 properties:
 *                   carrier:
 *                     type: string
 *                     example: Vodafone
 *                   networkType:
 *                     type: string
 *                     example: 4G
 *                   signalLevel:
 *                     type: integer
 *                     example: 3
 *                   signalDbm:
 *                     type: integer
 *                     example: -85
 *                   mcc:
 *                     type: string
 *                     example: "602"
 *                   mnc:
 *                     type: string
 *                     example: "01"
 *     responses:
 *       201:
 *         description: Connectivity log created successfully
 *       400:
 *         description: Missing or invalid data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.post('/', verifyToken, async (req, res) => {
    const user = req.user;

    if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
    }

    const { connectivityType, deviceId, location, mobileNetworkInfo, ...rest } = req.body;

    if (!connectivityType) {
        res.status(400).json({ message: "connectivityType is missing" });
    }

    if (!deviceId) {
        res.status(400).json({ message: "deviceId is missing" });
    }

    try {

        const device = await db.deviceInfo.findUnique({
            where: {
                id: deviceId
            }
        })

        if (!device) {
            res.status(400).json({ message: "device not found" });
        }

        // Step 1: Find or create location using fuzzy match
        let locationRecord = null;
        if (location?.latitude && location?.longitude) {
            locationRecord = await getOrCreateFuzzyLocation(
                location.latitude,
                location.longitude,
                location.accuracy
            );
        }

        // Step 2: Create mobile network info if provided
        let mobileNetworkInfoRecord = null;
        if (mobileNetworkInfo) {
            mobileNetworkInfoRecord = await db.mobileNetworkInfo.create({
                data: mobileNetworkInfo,
            });
        }

        // Step 3: Create connectivity log
        const log = await db.connectivityInfo.create({
            data: {
                deviceId,
                connectivityType,
                isConnected: true,
                locationId: locationRecord?.id,
                mobileNetworkInfoId: mobileNetworkInfoRecord?.id,
                ...rest
            },
            include: {
                device: true,
                mobileNetworkInfo: true,
                location: true
            }
        });

        res.status(201).json(log);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /api/connectivity:
 *   get:
 *     summary: Get all connectivity logs
 *     tags: [Connectivity]
 *     responses:
 *       200:
 *         description: A list of connectivity logs
 *       500:
 *         description: Internal server error
 */

router.get('/', async (req, res) => {
    try {
        const connectivityLogs = await db.connectivityInfo.findMany({
            include: { location: true, device: true, mobileNetworkInfo: true, },
        });
        res.json(connectivityLogs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /api/connectivity/{id}:
 *   get:
 *     summary: Get a connectivity log by ID
 *     tags: [Connectivity]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Connectivity log ID
 *     responses:
 *       200:
 *         description: Connectivity log details
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */

router.get('/:id', async (req, res) => {
    try {
        const connectivity = await db.connectivityInfo.findUnique({
            where: { id: req.params.id },
            include: { location: true, device: true, mobileNetworkInfo: true },
        });
        if (!connectivity) return res.status(404).json({ message: 'Connectivity log not found' });
        res.json(connectivity);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /api/connectivity/{id}:
 *   put:
 *     summary: Update a connectivity log
 *     tags: [Connectivity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Connectivity log ID
 *     requestBody:
 *       description: Fields to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               connectivityType: mobile
 *               isConnected: false
 *     responses:
 *       200:
 *         description: Connectivity log updated
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */

router.put('/:id', verifyToken, async (req, res) => {

    const user = req.user;
    const { id } = req.params;

    try {
        const log = await db.connectivity.findFirst({
            where: {
                id,
                device: {
                    userId: user.id
                }
            }
        })
        if (!log || user.role != UserRole.ADMIN) {
            res.status(401).json({ message: 'Unauthorized' });
        }

        const connectivity = await db.connectivityInfo.update({
            where: {
                id: req.params.id,
            },
            data: req.body,
            include: {
                location: true,
                device: true,
                mobileNetworkInfo: true
            }
        });
        res.json(connectivity);
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

/**
 * @swagger
 * /api/connectivity/{id}:
 *   delete:
 *     summary: Delete a connectivity log
 *     tags: [Connectivity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Connectivity log ID
 *     responses:
 *       200:
 *         description: Connectivity log deleted
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Deletion failed
 */

router.delete('/:id', verifyToken, async (req, res) => {

    const user = req.user;

    const log = await db.connectivity.findFirst({
        where: {
            id,
            device: {
                userId: user.id
            }
        }
    })

    if (!log || user.role != UserRole.ADMIN) {
        res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        await db.connectivityInfo.delete({ where: { id: req.params.id } });
        res.json({ message: 'Connectivity log deleted' });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

/**
 * @swagger
 * /api/connectivity/ping:
 *   get:
 *     summary: Lightweight ping to check connectivity and update lastPinged if needed
 *     tags: [Connectivity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         required: true
 *         description: Device ID to update lastPinged
 *     responses:
 *       200:
 *         description: Connectivity verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: connected
 *                 userId:
 *                   type: string
 *                 deviceId:
 *                   type: string
 *                 lastPinged:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing deviceId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 */
router.get('/ping', verifyToken, async (req, res) => {
    const user = req.user;
    const { deviceId } = req.query;

    if (!deviceId) {
        return res.status(400).json({ message: 'Missing deviceId' });
    }

    try {
        const device = await db.deviceInfo.findFirst({
            where: {
                id: deviceId,
                userId: user.id,
            },
        });

        if (!device) {
            return res.status(404).json({ message: 'Device not found or not owned by user' });
        }

        const now = new Date();
        const minutes = 5;
        const shouldUpdate =
            !device.lastPinged || (now - new Date(device.lastPinged)) > minutes * 60 * 1000;

        if (shouldUpdate) {
            await db.deviceInfo.update({
                where: { id: device.id },
                data: { lastPinged: now },
            });
        }

        return res.status(200).json({
            status: 'connected',
            userId: user.id,
            deviceId: device.id,
            lastPinged: shouldUpdate ? now : device.lastPinged,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @swagger
 * /api/connectivity/disconnect:
 *   post:
 *     summary: Log a disconnect event for a device
 *     tags: [Connectivity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *             properties:
 *               deviceId:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *               mobileNetworkInfo:
 *                 type: object
 *                 properties:
 *                   carrier:
 *                     type: string
 *                   networkType:
 *                     type: string
 *                   signalLevel:
 *                     type: integer
 *                   signalDbm:
 *                     type: integer
 *                   mcc:
 *                     type: string
 *                   mnc:
 *                     type: string
 *           example:
 *             deviceId: "665a7cc0cf8a973db4fcce4c"
 *             location:
 *               latitude: 30.044196
 *               longitude: 31.2357116
 *               accuracy: 10
 *             mobileNetworkInfo:
 *               carrier: "Vodafone"
 *               networkType: "4G"
 *               signalLevel: 2
 *               signalDbm: -90
 *               mcc: "602"
 *               mnc: "01"
 *     responses:
 *       201:
 *         description: Disconnection logged
 *       400:
 *         description: Missing or invalid data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.post('/disconnect', verifyToken, async (req, res) => {
    const user = req.user;
    const { deviceId, location, mobileNetworkInfo, ...rest } = req.body;

    if (!deviceId) {
        return res.status(400).json({ message: 'deviceId is required' });
    }

    try {
        const device = await db.deviceInfo.findFirst({
            where: {
                id: deviceId,
                userId: user.id,
            },
        });

        if (!device) {
            return res.status(404).json({ message: 'Device not found or not owned by user' });
        }

        // Step 1: Find or create fuzzy location (optional)
        let locationRecord = null;
        if (location?.latitude && location?.longitude) {
            locationRecord = await getOrCreateFuzzyLocation(
                location.latitude,
                location.longitude,
                location.accuracy
            );
        }

        // Step 2: Save mobile network info (optional)
        let mobileNetworkInfoRecord = null;
        if (mobileNetworkInfo) {
            mobileNetworkInfoRecord = await db.mobileNetworkInfo.create({
                data: mobileNetworkInfo,
            });
        }

        // Step 3: Create connectivity log with isConnected: false
        const disconnectLog = await db.connectivityInfo.create({
            data: {
                deviceId,
                connectivityType: 'none', // or retain previous if sent
                isConnected: false,
                locationId: locationRecord?.id,
                mobileNetworkInfoId: mobileNetworkInfoRecord?.id,
                ...rest,
            },
        });

        res.status(201).json(disconnectLog);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});




export default router;