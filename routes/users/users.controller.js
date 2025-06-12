import express from 'express';
import * as fs from 'fs';
import { db } from '../../lib/database.js';
import jwt from 'jsonwebtoken'
import { verifyToken } from '../../lib/auth.js'

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
 *       403:
 *         description: Forbidden
 */
router.get("/active_user", verifyToken, (req, res) => {

    jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            const { user } = authData;
            try {
                const activeUser = await db.user.findUnique({
                    where: {
                        id: user.id
                    },
                })

                if (!activeUser) {
                    return res.status(404).json({ message: "User not found" })
                }

                const formattedUser = { ...activeUser }
                // console.log(authData)
                res.status(200).json(formattedUser);
            } catch (e) {
                res.status(500).json({ message: "internal error" })
            }
        }
    })
})

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
 */
router.get("/", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET, async (err, _) => {
        if (err) {
            res.status(403).json({ message: 'Invalid token' });
        } else {
            const users = await db.user.findMany();
            res.status(200).json(users);
        }
    })
})


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
 *       401:
 *         description: Unauthorized
 */
router.patch("/:userId", verifyToken, async (req, res) => {
    const userId = req.params.userId; // Retrieve id=require(params
    const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
    const { user } = decodedToken;

    if (user.id !== userId && user.role !== UserRole.ADMIN) {
        res.status(401).json({ message: "unauthorized!" });
    }
    const {
        name,
        email,
        password,
        phone,
        gender,
    } = req.body;

    if (isNaN(level)) {
        res.status(400).json({ message: "Level must be a number." });
    }

    let avatar;

    try {

        const existingUser = await db.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!existingUser) {
            res.status(404).json({ message: "user not found" });
        }

        if (req.files?.avatar) {

            if (Array.isArray(req.files?.avatar)) {
                res.status(400).json({ message: "avatar must be a single image" });
            }

            const avatarFile = req.files?.avatar;

            if (avatarFile.mimetype.split('/')[0] !== "image") {
                res.status(406).json({ message: "avatar must be an image" });
            }
            try {
                if (existingUser.avatar) {
                    fs.unlinkSync('./uploads' + existingUser.avatar);
                }
            } catch (error) {
                console.error(error);
            }
            //Use the mv() method to place the file in the upload directory (i.e. "uploads")
            avatarFile.mv(`./uploads/users/${userId}/` + avatarFile.name);
            avatar = `/users/${userId}/${avatarFile.name}`.replaceAll(` `, "%20");
            // console.log(avatar);
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                password,
                phone,
                gender,
                avatar
            }
        })

        res.status(200).json(updatedUser); // Return userId and user data
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal error" });
    }
})

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
router.delete("/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId; 
        const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
        const { user } = decodedToken;

        if (user.id !== userId && user.role !== UserRole.ADMIN) {
            res.status(401).json({ message: "unauthorized!" });
        }

        const deletedUser = await db.user.delete({
            where: { id: userId },
        })

        res.status(204).json(deletedUser); // Return userId and user data
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
})



export default router;