import { getRoomPlayers, getRoomHost, getRoomDraftState } from './redis.js';

// API endpoint to get room status (stateless)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    // Decode room configuration from room ID
    let roomConfig;
    try {
      let base64 = roomId.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const json = Buffer.from(base64, 'base64').toString();
      roomConfig = JSON.parse(json);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid room ID' });
    }

    // Get current active players from Redis
    const players = await getRoomPlayers(roomId);
    const hostId = await getRoomHost(roomId);
    const draftState = await getRoomDraftState(roomId);
    // Room status retrieved

    // Determine room status based on draft state
    let status = 'waiting';
    if (draftState && draftState.status === 'drafting') {
      status = 'drafting';
    } else if (players.length >= 2) {
      status = 'ready';
    }

    // Reconstruct room data from encoded config + current players
    const roomData = {
      id: roomId,
      scenario: roomConfig.s,
      draftMode: roomConfig.d,
      playersPerTeam: roomConfig.p,
      players: players,
      status: status,
      createdAt: roomConfig.t,
      hostId: hostId,
      draftState: draftState
    };

    res.status(200).json({ 
      success: true, 
      room: roomData 
    });
  } catch (error) {
    console.error('Room status error:', error);
    res.status(500).json({ error: 'Failed to get room status' });
  }
}