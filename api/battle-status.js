import { redis } from './redis.js';

// API endpoint to get battle status and results
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    // Get battle data from Redis
    const battleData = await redis.get(`room:${roomId}:battle`);
    
    if (!battleData) {
      return res.status(404).json({ error: 'No battle found' });
    }

    res.status(200).json({ 
      success: true, 
      battleData: battleData
    });
  } catch (error) {
    console.error('Battle status error:', error);
    res.status(500).json({ error: 'Failed to get battle status' });
  }
}