import { addPlayerToRoom, getRoomHost } from './redis.js';

// API endpoint to create a new room (stateless, URL-encoded)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scenario, draftMode, playersPerTeam, creatorId } = req.body;

    // Generate encoded room ID containing all room configuration
    const roomConfig = {
      s: scenario,
      d: draftMode,
      p: playersPerTeam,
      t: new Date().toISOString()
    };
    
    const json = JSON.stringify(roomConfig);
    const base64 = Buffer.from(json).toString('base64');
    const roomId = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // Store creator in Redis as host
    let players = [];
    if (creatorId) {
      players = await addPlayerToRoom(roomId, {
        id: creatorId,
        joinedAt: new Date().toISOString()
      }, true); // Mark as host
    }

    // Return room data reconstructed from encoded ID
    const roomData = {
      id: roomId,
      scenario,
      draftMode,
      playersPerTeam,
      players: players,
      status: 'waiting',
      createdAt: roomConfig.t,
      hostId: creatorId, // Track who created the room
      draftState: null
    };

    // Room created successfully

    res.status(200).json({ 
      success: true, 
      room: roomData,
      shareUrl: `/room/${roomId}`
    });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
}