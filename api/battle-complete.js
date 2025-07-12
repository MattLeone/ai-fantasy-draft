import { redis } from './redis.js';

// API endpoint to store battle results (host only)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId, battleResult, battle } = req.body;

    // Store battle results in Redis for both players to access
    const battleData = {
      battle: battle,
      result: battleResult,
      completedAt: new Date().toISOString(),
      status: 'completed'
    };

    await redis.set(`room:${roomId}:battle`, battleData, { ex: 3600 });

    res.status(200).json({ 
      success: true, 
      message: 'Battle results stored successfully'
    });
  } catch (error) {
    console.error('Battle complete error:', error);
    res.status(500).json({ error: 'Failed to store battle results' });
  }
}