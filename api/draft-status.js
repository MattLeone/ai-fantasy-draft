import { redis } from './redis.js';

// API endpoint to get current draft status
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    // Get current draft state
    const draftState = await redis.get(`room:${roomId}:draft`);
    if (!draftState) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.status(200).json({ 
      success: true, 
      draftState: draftState
    });
  } catch (error) {
    console.error('Draft status error:', error);
    res.status(500).json({ error: 'Failed to get draft status' });
  }
}