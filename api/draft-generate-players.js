import { redis } from './redis.js';

// API endpoint to store generated AI players for draft
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId, players } = req.body;

    // Get current draft state
    const draftState = await redis.get(`room:${roomId}:draft`);
    if (!draftState) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Only update if players haven't been generated yet
    if (draftState.availablePlayers.length === 0) {
      draftState.availablePlayers = players;
      draftState.playersGenerated = true;
      draftState.playersGeneratedAt = new Date().toISOString();
      draftState.generatingPlayers = false; // Generation complete

      // Save updated state
      await redis.set(`room:${roomId}:draft`, draftState, { ex: 3600 });
    }

    res.status(200).json({ 
      success: true, 
      message: `Generated ${players.length} players`,
      draftState: draftState
    });
  } catch (error) {
    console.error('Generate players error:', error);
    res.status(500).json({ error: 'Failed to save generated players' });
  }
}