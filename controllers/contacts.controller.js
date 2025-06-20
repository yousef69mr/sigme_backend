import express from 'express';
// import * as fs from 'fs';
import { db } from '../lib/database.js';
// import jwt from 'jsonwebtoken'
import { verifyToken } from '../lib/auth.js'
import { ContactTypeEnum } from '@prisma/client'

const router = express.Router();

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Create a new user contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - email
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+201234567890"
 *               email:
 *                 type: string
 *                 example: "contact@example.com"
 *               contactName:
 *                 type: string
 *                 example: "Ahmed Ali"
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [EMERGENCY, FAVORITE]
 *     responses:
 *       201:
 *         description: Contact created successfully
 *       400:
 *         description: Missing phone or email
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Contact already exists
 *       500:
 *         description: Server error
 */

router.post('/', verifyToken, async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const {
    phone,
    email,
    contactName,
    userId,
    type = ContactTypeEnum.EMERGENCY
  } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "phone is missing" });
  }

  if (!email) {
    return res.status(400).json({ message: "email is missing" });
  }

  try {

    const userContact = await db.contact.findFirst({
      where: {
        userId: userId ?? user.id,
        phone,
        email,
        type
      }
    })

    if (userContact) {
      return res.status(403).json({ message: "user contact is already exists !!" });
    }

    const contactUser = await db.user.findFirst({
      where: {
        id: userId ?? user.id,
      }
    })

    if (!contactUser) {
      return res.status(404).json({ message: "user not found!!" });
    }

    const contact = await db.contact.create({
      data: {
        phone,
        email,
        type,
        contactName,
        user: { connect: { id: contactUser.id } },
      }
    });

    res.status(201).json(contact);
  } catch (e) {
    console.error('Contact creation error:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Get all user contacts (Admin only)
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all user contacts
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.get('/', verifyToken, async (req, res) => {

  const user = req.user;

  if (user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const contacts = await db.contact.findMany({
      include: {
        user: true
      }
    });
    res.json(contacts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/contacts/user-contacts:
 *   get:
 *     summary: Get contacts for authenticated user
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's contacts
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.get('/user-contacts', verifyToken, async (req, res) => {

  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const contacts = await db.contact.findMany({
      where: {
        userId: user.id
      }
    });
    res.json(contacts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     summary: Get a specific contact by ID
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */

router.get('/:id', verifyToken, async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  try {

    const existingContact = await db.contact.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingContact && user.role !== 'ADMIN') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!existingContact) return res.status(404).json({ error: 'Contact not found' });
    res.json(existingContact);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/contacts/{id}:
 *   patch:
 *     summary: Update a user contact
 *     tags: [Contacts]
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
 *             example:
 *               phone: "+201234567891"
 *               contactName: "Updated Name"
 *     responses:
 *       200:
 *         description: Contact updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */

router.patch('/:id', verifyToken, async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const existingContact = await db.contact.findFirst({
    where: {
      id: id,
      userId: user.id,
    },
  });

  if (!existingContact && user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {

    if (!existingContact) {
      return res.status(404).json({ message: 'Contact not found for this user' });
    }

    const updatedContact = await db.contact.update({
      where: { id: existingContact.id },
      data: {
        ...req.body, // Accept any updatable field
        updatedAt: new Date(),
      },
    });

    res.json(updatedContact);
  } catch (e) {
    console.error('Device update error:', e);
    res.status(500).json({ error: e.message });
  }
});


/**
 * @swagger
 * /api/contacts/{id}:
 *   delete:
 *     summary: Delete a user contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact deleted
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Deletion failed
 */

router.delete('/:id', verifyToken, async (req, res) => {

  const user = req.user;
  const { id } = req.params;

  const existingContact = await db.contact.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existingContact && user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    await db.contact.delete({ where: { id } });
    res.json({ message: 'Contact deleted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;