import express from 'express';
import bcrypt from 'bcrypt';
import * as fs from 'fs';
import { db } from '../lib/database.js';
import { verifyToken } from '../lib/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/users/active_user:
 *   get:
 *     summary: Get the currently active user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The active user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden
 */
router.get('/active_user', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const foundUser = await db.user.findUnique({ where: { id: userId } });

        if (!foundUser) return res.status(404).json({ message: 'User not found' });

        res.status(200).json(foundUser);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', verifyToken, async (req, res) => {

    const user = req.user;

    if (user.role !== 'ADMIN') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const users = await db.user.findMany();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/users/{userId}:
 *   patch:
 *     summary: Update user info
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               gender:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.patch('/:userId', verifyToken, async (req, res) => {
    const { userId } = req.params;
    const user = req.user;

    if (user.id !== userId && user.role !== 'ADMIN') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, email, password, phone, gender } = req.body;

    let avatar;
    try {
        const existingUser = await db.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.files?.avatar) {
            const avatarFile = req.files.avatar;
            if (Array.isArray(avatarFile)) {
                return res.status(400).json({ message: 'Only one avatar file allowed' });
            }

            if (!avatarFile.mimetype.startsWith('image/')) {
                return res.status(406).json({ message: 'Avatar must be an image' });
            }

            try {
                if (existingUser.avatar) {
                    fs.unlinkSync('./uploads' + existingUser.avatar);
                }
            } catch (error) {
                console.warn('Avatar cleanup failed:', error.message);
            }

            avatarFile.mv(`./uploads/users/${userId}/` + avatarFile.name);
            avatar = `/users/${userId}/${avatarFile.name}`.replace(/ /g, '%20');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: { name, email, password: hashedPassword, phone, gender, avatar },
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal error' });
    }
});

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       204:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/:userId', verifyToken, async (req, res) => {
    const { userId } = req.params;
    const user = req.user;

    if (user.id !== userId && user.role !== 'ADMIN') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        await db.user.delete({ where: { id: userId } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Internal error' });
    }
});

/**
 * @swagger
 * /api/users/{userId}/alert-mode:
 *   patch:
 *     summary: Update user's alert mode
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               alertModeId:
 *                 type: string
 *                 example: "60f5a4c1b6f1a2b3c4d5e6f7"
 *     responses:
 *       200:
 *         description: Alert mode updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch('/:userId/alert-mode', verifyToken, async (req, res) => {
    const { userId } = req.params;
    const user = req.user;

    if (user.id !== userId && user.role !== 'ADMIN') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { alertModeId } = req.body;

    try {
        const existingUser = await db.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                alertMode: {
                    connect: {
                        id: alertModeId
                    }
                }
            },
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal error' });
    }
});

export default router;
