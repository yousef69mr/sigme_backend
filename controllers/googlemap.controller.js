import express from 'express';
import { db } from '../lib/database.js';
import { verifyToken } from '../lib/auth.js'
import {findCandidates} from '../lib/3rd_party/googlemap.js'

const router = express.Router();

/**
 * @swagger
 * /api/places/find:
 *   get:
 *     summary: Find a place by text query using Google Maps API
 *     tags:
 *       - Places
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: input
 *         schema:
 *           type: string
 *         required: true
 *         description: Text description of the place to search for (e.g., "Great Pyramid of Giza")
 *     responses:
 *       200:
 *         description: Place found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 place_id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 formatted_address:
 *                   type: string
 *                 geometry:
 *                   type: object
 *                   properties:
 *                     location:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *       400:
 *         description: Missing required parameter `input`
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       404:
 *         description: No place found
 *       500:
 *         description: Internal server error
 */
router.get('/find', async (req, res) => {
  const { input } = req.query;

  if (!input) {
    return res.status(400).json({ error: 'Missing required parameter: input' });
  }

  try {
    const place = await findCandidates(input);

    if (place) {
      res.json(place);
    } else {
      res.status(404).json({ message: 'No place found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



export default router;
