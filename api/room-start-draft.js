import { getRoomHost, getRoomPlayers, getRoomConfig, redis } from './redis.js';

// API endpoint to start the draft (host only)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId, playerId, draftSettings } = req.body;

    // Get room configuration from Redis
    const roomConfig = await getRoomConfig(roomId);
    if (!roomConfig) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Verify this player is the host
    const hostId = await getRoomHost(roomId);
    if (hostId !== playerId) {
      return res.status(403).json({ error: 'Only the host can start the draft' });
    }

    // Get room players to set up teams
    const players = await getRoomPlayers(roomId);
    if (players.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 players to start draft' });
    }

    // Randomize player order for fair draft start
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    // Initialize teams based on shuffled players
    const teams = shuffledPlayers.map((player, index) => ({
      id: `team_${index + 1}`,
      name: draftSettings.scenario.teamRoles ? draftSettings.scenario.teamRoles[index] : `Team ${index + 1}`,
      owner: player.id,
      players: []
    }));

    // Store comprehensive draft state in Redis
    const draftState = {
      status: 'drafting',
      settings: draftSettings,
      teams: teams,
      playerOrder: shuffledPlayers.map(p => p.id), // Randomized order for turns
      currentRound: 1,
      currentTeamIndex: 0,
      currentTurn: shuffledPlayers[0].id, // Random player goes first
      startedAt: new Date().toISOString(),
      startedBy: playerId,
      availablePlayers: [], // Will be populated by first AI generation
      generatingPlayers: false, // Track if AI generation is in progress
      lastPick: null
    };

    await redis.set(`room:${roomId}:draft`, draftState, { ex: 3600 });

    res.status(200).json({ 
      success: true, 
      draftState: draftState
    });
  } catch (error) {
    console.error('Start draft error:', error);
    res.status(500).json({ error: 'Failed to start draft' });
  }
}