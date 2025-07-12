import { getRoomHost, getRoomPlayers, redis } from './redis.js';

// API endpoint to start the draft (host only)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId, playerId, draftSettings } = req.body;

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

    // Initialize teams based on players
    const teams = players.map((player, index) => ({
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
      playerOrder: players.map(p => p.id), // Order for turns
      currentRound: 1,
      currentTeamIndex: 0,
      currentTurn: players[0].id, // First player goes first
      startedAt: new Date().toISOString(),
      startedBy: playerId,
      availablePlayers: [], // Will be populated by first AI generation
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