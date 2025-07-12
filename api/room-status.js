import { getRoomPlayers, getRoomHost, getRoomDraftState, getRoomConfig } from './redis.js';

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

    // Get room configuration from Redis
    const roomConfig = await getRoomConfig(roomId);
    if (!roomConfig) {
      return res.status(404).json({ error: 'Room not found' });
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

    // Reconstruct room data from Redis config + current players
    const roomData = {
      id: roomId,
      scenario: roomConfig.scenario,
      draftMode: roomConfig.draftMode,
      playersPerTeam: roomConfig.playersPerTeam,
      players: players,
      status: status,
      createdAt: roomConfig.createdAt,
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