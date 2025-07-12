import { redis } from './redis.js';

// API endpoint to make a draft pick (turn-based)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId, playerId, player, pickType } = req.body; // pickType: 'ai_generated' or 'custom'

    // Get current draft state
    const draftState = await redis.get(`room:${roomId}:draft`);
    if (!draftState) {
      return res.status(404).json({ error: 'Draft not found or not started' });
    }

    // Verify it's this player's turn
    if (draftState.currentTurn !== playerId) {
      return res.status(400).json({ error: 'Not your turn' });
    }

    // Verify player hasn't been picked yet
    const allPicks = draftState.teams.reduce((all, team) => [...all, ...team.players], []);
    if (allPicks.find(p => p.name === player.name)) {
      return res.status(400).json({ error: 'Player already drafted' });
    }

    // Add pick to current team
    const currentTeamIndex = draftState.currentTeamIndex;
    draftState.teams[currentTeamIndex].players.push({
      ...player,
      pickedBy: playerId,
      pickedAt: new Date().toISOString(),
      pickNumber: allPicks.length + 1
    });

    // Remove picked player from available players pool
    draftState.availablePlayers = draftState.availablePlayers.filter(p => p.name !== player.name);

    // Update turn logic (snake draft)
    const { nextTeamIndex, nextRound } = calculateNextTurn(
      draftState.currentTeamIndex,
      draftState.currentRound,
      draftState.settings.teamCount,
      draftState.settings.playersPerTeam
    );

    // Determine next player's turn
    const nextPlayerId = nextTeamIndex !== -1 ? draftState.playerOrder[nextTeamIndex] : null;

    // Update draft state
    draftState.currentTeamIndex = nextTeamIndex;
    draftState.currentRound = nextRound;
    draftState.currentTurn = nextPlayerId;
    draftState.lastPick = {
      player: player,
      by: playerId,
      at: new Date().toISOString()
    };

    // Check if draft is complete
    if (nextTeamIndex === -1) {
      draftState.status = 'completed';
      draftState.completedAt = new Date().toISOString();
    }

    // Save updated state
    await redis.set(`room:${roomId}:draft`, draftState, { ex: 3600 });

    res.status(200).json({ 
      success: true, 
      draftState: draftState,
      message: `${player.name} drafted by ${draftState.teams[currentTeamIndex].name}`
    });
  } catch (error) {
    console.error('Draft pick error:', error);
    res.status(500).json({ error: 'Failed to make draft pick' });
  }
}

// Snake draft turn calculation
function calculateNextTurn(currentTeamIndex, currentRound, teamCount, playersPerTeam) {
  const totalRounds = playersPerTeam;
  
  // Snake draft pattern: 0,1 -> 1,0 -> 0,1 -> 1,0...
  const isOddRound = currentRound % 2 === 1;
  
  let nextTeamIndex, nextRound;
  
  if (isOddRound) {
    // Odd rounds: go forward (0 -> 1)
    if (currentTeamIndex < teamCount - 1) {
      nextTeamIndex = currentTeamIndex + 1;
      nextRound = currentRound;
    } else {
      // End of round, go to next round, reverse direction
      nextTeamIndex = teamCount - 1;
      nextRound = currentRound + 1;
    }
  } else {
    // Even rounds: go backward (1 -> 0)
    if (currentTeamIndex > 0) {
      nextTeamIndex = currentTeamIndex - 1;
      nextRound = currentRound;
    } else {
      // End of round, go to next round, forward direction
      nextTeamIndex = 0;
      nextRound = currentRound + 1;
    }
  }
  
  // Check if draft is complete
  if (nextRound > totalRounds) {
    return { nextTeamIndex: -1, nextRound: nextRound };
  }
  
  return { nextTeamIndex, nextRound };
}