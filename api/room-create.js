import { addPlayerToRoom, getRoomHost, generateRoomId, setRoomConfig } from './redis.js';

// API endpoint to create a new room (stateless, URL-encoded)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scenario, draftMode, playersPerTeam, creatorId } = req.body;

    // Generate simple room ID
    const roomId = generateRoomId();
    
    // Store room configuration in Redis
    const roomConfig = {
      scenario,
      draftMode,
      playersPerTeam,
      createdAt: new Date().toISOString()
    };
    
    await setRoomConfig(roomId, roomConfig);

    // Store creator in Redis as host
    let players = [];
    if (creatorId) {
      players = await addPlayerToRoom(roomId, {
        id: creatorId,
        joinedAt: new Date().toISOString()
      }, true); // Mark as host
    }

    // Return room data
    const roomData = {
      id: roomId,
      scenario,
      draftMode,
      playersPerTeam,
      players: players,
      status: 'waiting',
      createdAt: roomConfig.createdAt,
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