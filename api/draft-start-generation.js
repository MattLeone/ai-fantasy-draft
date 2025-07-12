import { redis } from './redis.js';

// API endpoint to mark AI generation as started
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId } = req.body;

    // Get current draft state
    const draftState = await redis.get(`room:${roomId}:draft`);
    if (!draftState) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Mark generation as starting
    draftState.generatingPlayers = true;
    draftState.generationStartedAt = new Date().toISOString();

    // Save updated state
    await redis.set(`room:${roomId}:draft`, draftState, { ex: 3600 });

    res.status(200).json({ 
      success: true, 
      message: 'Generation started'
    });
  } catch (error) {
    console.error('Start generation error:', error);
    res.status(500).json({ error: 'Failed to mark generation started' });
  }
}