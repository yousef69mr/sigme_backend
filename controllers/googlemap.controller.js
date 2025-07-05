import express from 'express';
import { verifyToken } from '../lib/auth.js'
import {findCandidates,enrichGoogleCandidate} from '../lib/3rd_party/googleplaces/find-candidates.js'

const router = express.Router();

/**
 * @swagger
 * /api/places/find:
 *   get:
 *     summary: Find a place by text query and analyze signal quality per network carrier
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
 *       - in: query
 *         name: carrier
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional carrier name to filter results (e.g., "vodafone")
 *       - in: query
 *         name: minSignalCount
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: Minimum number of signal samples required to include a carrier
 *     responses:
 *       200:
 *         description: Places found with signal quality per network carrier
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   place_id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   location:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   signalByCarrier:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         carrier:
 *                           type: string
 *                         avgDbm:
 *                           type: number
 *                           description: Average signal strength in dBm
 *                         quality:
 *                           type: string
 *                           enum: [Excellent, Good, Weak, No Signal]
 *                         count:
 *                           type: integer
 *                           description: Number of signal samples used in calculation
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
 const { input, carrier, minSignalCount } = req.query;

  if (!input) {
    return res.status(400).json({ error: 'Missing required parameter: input' });
  }

  try {
    const candidates = await findCandidates(input);

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({ message: 'No place found' });
    }

    const enriched = await Promise.all(
      candidates.map(async (candidate) => {
        const enrichedData = await enrichGoogleCandidate(candidate);

        // Apply optional filters
        if (carrier) {
          enrichedData.signalByCarrier = enrichedData.signalByCarrier.filter(
            c => c.carrier.toLowerCase() === carrier.toLowerCase()
          );
        }

        if (minSignalCount) {
          enrichedData.signalByCarrier = enrichedData.signalByCarrier.filter(
            c => c.count >= Number(minSignalCount)
          );
        }

        return enrichedData;
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error("Find error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



export default router;
