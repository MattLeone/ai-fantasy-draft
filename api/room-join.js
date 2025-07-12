import { getRoomPlayers, addPlayerToRoom, getRoomHost, getRoomConfig } from './redis.js';

// API endpoint to join an existing room (stateless)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId, playerId } = req.body;

    // Get room configuration from Redis
    const roomConfig = await getRoomConfig(roomId);
    if (!roomConfig) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Get current players from Redis
    const players = await getRoomPlayers(roomId);

    // Check room capacity
    if (players.length >= 2) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Add player to room via Redis
    const updatedPlayers = await addPlayerToRoom(roomId, {
      id: playerId,
      joinedAt: new Date().toISOString()
    });
    
    // Get the host ID
    const hostId = await getRoomHost(roomId);
    
    // Player joined successfully

    // Reconstruct room data from Redis config + current players
    const roomData = {
      id: roomId,
      scenario: roomConfig.scenario,
      draftMode: roomConfig.draftMode,
      playersPerTeam: roomConfig.playersPerTeam,
      players: updatedPlayers,
      status: updatedPlayers.length >= 2 ? 'ready' : 'waiting',
      createdAt: roomConfig.createdAt,
      hostId: hostId,
      draftState: null
    };

    console.log(`Player ${playerId} joined room ${roomId}. Players: ${players.length}/2`);

    res.status(200).json({ 
      success: true, 
      room: roomData 
    });
  } catch (error) {
    console.error('Room join error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
}