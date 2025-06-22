import express from 'express';
import { db } from '../lib/database.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Successful login, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post("/login", async (req, res) => {
    const { password, email } = req.body;

    if (!email || !password)
        return res.status(400).send({ message: "Missing email or password." });

    try {
        // email or phone login 
        const user = await db.user.findFirst({ where: { OR: [{ email }, { phone: email }] } });
        if (!user) return res.status(404).json({ message: "User not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

        const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *               - phone
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       201:
 *         description: User registered successfully, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Email or phone already in use
 *       500:
 *         description: Internal server error
 */
router.post("/register", async (req, res) => {
    const { name, password, phone, email, gender } = req.body;

    if (!name || !password || !phone || !email)
        return res.status(400).send({ message: "Missing required fields." });

    try {
        const existingUser = await db.user.findFirst({
            where: { OR: [{ email }, { phone }] },
        });

        if (existingUser)
            return res.status(403).json({ message: "Email or phone already in use." });

        const hashedPassword = await bcrypt.hash(password, 10);

        const defaultAlertMode = await db.alertMode.findFirst();

        const userData = {
            name,
            phone,
            email,
            password: hashedPassword,
            gender,
        };

        if (defaultAlertMode) {
            userData.alertMode = {
                connect: { id: defaultAlertMode.id }
            };
        }

        const user = await db.user.create({
            data: userData
        });

        const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({ token });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
