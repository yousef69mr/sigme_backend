import express from 'express';
import { db } from '../../lib/database.js';
import jwt from 'jsonwebtoken'

const router = express.Router();

router.post("/login", async (req, res) => {
    // console.log(req.body);
    const { password, email } = req.body;
    // console.log(userData);
    if (!email || !password) return res.status(400).send({ message: "Missing email or password." });

    // try {


    const user = await db.user.findUnique({ where: { email, password } }); 0

    if (!user) return res.status(404).json({ message: "User not found." });

    jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
        if (err) throw err;

        res.status(200).json({ token });

    })

    // } catch (error) {
    //   res.status(500).json({ message: "internal error." });
    // }
}
)


router.post("/register", async (req, res) => {
    // console.log(req.body);
    const { name, password, phone, studentId, email, gender } = req.body;
    // console.log(userData);
    if (!name) return res.status(400).send({ message: "name is missing!" });

    if (!password) return res.status(400).send({ message: "password is missing!" });

    if (!phone) return res.status(400).send({ message: "phone is missing!" });

    if (!email) return res.status(400).send({ message: "email is missing!" });

    // if (!level) return res.status(400).send({ message: "level is missing!" });

    // try {

    const existingUser = await db.user.findFirst({
        where: {
            OR: [
                { email },
                { phone }
            ],
        }
    });

    if (existingUser) {
        res.status(403).json({ message: "Email or Student ID already in use." });
        return;
    }

    const user = await db.user.create({ data: { name, phone, studentId, email, password, gender } });

    jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
        if (err) throw err;

        res.status(201).json({ token });

    })

}
)


export default router;