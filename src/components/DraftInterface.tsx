import React, { useState, useEffect, useRef } from 'react';
import type { DraftSettings, Team, Player } from '../types';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useRoom } from '../hooks/useRoom';

interface DraftInterfaceProps {
  settings: DraftSettings;
  teams: Team[]; // Initial teams, will be overridden by draft state
  onDraftComplete: (teams: Team[]) => void;
}

const DraftInterface: React.FC<DraftInterfaceProps> = ({ settings, teams, onDraftComplete }) => {
  // Multiplayer draft state
  const [draftState, setDraftState] = useState<any>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [customPlayerName, setCustomPlayerName] = useState('');
  const [customPlayerDescription, setCustomPlayerDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pickingPlayer, setPickingPlayer] = useState<string | null>(null); // Track which player is being picked
  const isGeneratingRef = useRef(false);
  const hasGeneratedRef = useRef(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  const { generatePlayers, isLoading: generatingPlayers } = useClaudeAPI();
  const { getDraftStatus, makeDraftPick, storeGeneratedPlayers, playerId } = useRoom();

  // Get room ID from URL for multiplayer draft
  const getRoomId = () => {
    const path = window.location.pathname;
    const roomMatch = path.match(/^\/room\/(.+)$/);
    return roomMatch ? roomMatch[1] : null;
  };

  // Load initial draft state and start polling
  useEffect(() => {
    const roomId = getRoomId();
    if (roomId) {
      loadDraftState(roomId);
      startPolling(roomId);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Generate AI players when needed (only once)
  useEffect(() => {
    if (draftState && settings.mode === 'ai_curated' && 
        draftState.availablePlayers.length === 0 && 
        !isGeneratingRef.current && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true; // Mark as generated to prevent re-runs
      loadAIGeneratedPlayers();
    }
  }, [draftState?.availablePlayers?.length, settings.mode]);

  const loadDraftState = async (roomId: string) => {
    try {
      const state = await getDraftStatus(roomId);
      if (state) {
        setDraftState(state);
        
        // Always use server's available players list (it's the source of truth)
        setAvailablePlayers(state.availablePlayers || []);
        
        // Check if draft is complete
        if (state.status === 'completed') {
          onDraftComplete(state.teams);
        }
      }
    } catch (err) {
      setError('Failed to load draft state');
      console.error('Error loading draft state:', err);
    }
  };

  const startPolling = (roomId: string) => {
    pollingRef.current = setInterval(() => {
      loadDraftState(roomId);
    }, 3000); // Poll every 3 seconds
  };

  const loadAIGeneratedPlayers = async () => {
    if (isGeneratingRef.current) return;
    
    isGeneratingRef.current = true;
    try {
      const players = await generatePlayers(
        settings.scenario.name, 
        settings.teamCount * settings.playersPerTeam + 15 // Extra options for multiplayer
      );
      
      // Store generated players in Redis for both players to access
      const roomId = getRoomId();
      if (roomId) {
        const updatedState = await storeGeneratedPlayers(roomId, players);
        setDraftState(updatedState);
        setAvailablePlayers(players);
      } else {
        setAvailablePlayers(players);
      }
    } catch (err) {
      setError('Failed to generate players');
      console.error('Failed to generate players:', err);
    } finally {
      isGeneratingRef.current = false;
    }
  };

  const handlePlayerPick = async (player: Player) => {
    const roomId = getRoomId();
    if (!roomId || !draftState) return;

    // Check if it's the current player's turn
    if (draftState.currentTurn !== playerId) {
      setError("It's not your turn!");
      return;
    }

    // Prevent clicking if already picking
    if (pickingPlayer) return;

    try {
      setError(null);
      setPickingPlayer(player.name); // Show loading state for this player
      
      const updatedState = await makeDraftPick(roomId, player);
      setDraftState(updatedState);
      
      // Update available players from server state (server removes picked players)
      setAvailablePlayers(updatedState.availablePlayers || []);
      
      // Check if draft is complete
      if (updatedState.status === 'completed') {
        onDraftComplete(updatedState.teams);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make pick');
    } finally {
      setPickingPlayer(null); // Clear loading state
    }
  };

  const handleCustomPlayer = async () => {
    if (!customPlayerName.trim() || !customPlayerDescription.trim()) {
      setError('Please enter both name and description for custom player');
      return;
    }

    const customPlayer: Player = {
      id: `custom_${Date.now()}`,
      name: customPlayerName.trim(),
      description: customPlayerDescription.trim(),
      type: 'user_created'
    };

    await handlePlayerPick(customPlayer);
    
    // Clear custom player form
    setCustomPlayerName('');
    setCustomPlayerDescription('');
  };

  // Helper functions
  const isMyTurn = () => draftState?.currentTurn === playerId;
  const getCurrentTeamName = () => {
    if (!draftState) return '';
    const currentTeam = draftState.teams[draftState.currentTeamIndex];
    return currentTeam?.name || `Team ${draftState.currentTeamIndex + 1}`;
  };
  const getMyTeam = () => draftState?.teams.find((team: any) => team.owner === playerId);
  const getOpponentTeam = () => draftState?.teams.find((team: any) => team.owner !== playerId);

  // Loading state
  if (!draftState) {
    return (
      <div className="draft-interface">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading draft...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-interface">
      <div className="draft-header">
        <h2>🏆 {settings.scenario.name} Draft</h2>
        <div className="scenario-description">
          <p>{settings.scenario.description}</p>
        </div>
        <div className="draft-info">
          <div className="round-info">
            Round {draftState.currentRound} of {settings.playersPerTeam}
          </div>
          <div className="turn-info">
            {isMyTurn() ? (
              <span className="your-turn">🔥 Your Turn!</span>
            ) : (
              <span className="waiting">⏳ Waiting for {getCurrentTeamName()}...</span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="draft-content">
        {/* Teams Display */}
        <div className="teams-section">
          <h3>Teams</h3>
          <div className="teams-grid">
            {draftState.teams.map((team: any, index: number) => {
              const isMyTeam = team.owner === playerId;
              const isCurrentTeam = index === draftState.currentTeamIndex;
              
              return (
                <div 
                  key={team.id} 
                  className={`team-card ${isMyTeam ? 'my-team' : 'opponent-team'} ${isCurrentTeam ? 'current-turn' : ''}`}
                >
                  <div className="team-header">
                    <h4>{team.name}</h4>
                    <span className="team-owner">
                      {isMyTeam ? '(You)' : '(Opponent)'}
                    </span>
                    {isCurrentTeam && <span className="turn-indicator">📍</span>}
                  </div>
                  <div className="team-players">
                    {team.players.map((player: any, pIndex: number) => (
                      <div key={pIndex} className="player-card drafted">
                        <div className="player-header">
                          <span className="player-name">{player.name}</span>
                          <span className="pick-number">#{player.pickNumber}</span>
                        </div>
                        <p className="player-description">{player.description}</p>
                      </div>
                    ))}
                    {/* Empty slots */}
                    {Array.from({ length: settings.playersPerTeam - team.players.length }, (_, i) => (
                      <div key={`empty-${i}`} className="player-card empty">
                        <span>Empty slot</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Selection - Only show if it's your turn */}
        {isMyTurn() && (
          <div className="player-selection">
            <h3>Make Your Pick</h3>
            
            {settings.mode === 'ai_curated' && (
              <div className="ai-players-section">
                <h4>Available Players</h4>
                {generatingPlayers ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <p>Generating players...</p>
                  </div>
                ) : availablePlayers.length > 0 ? (
                  <div className="players-grid">
                    {availablePlayers.map((player, index) => {
                      const isPicking = pickingPlayer === player.name;
                      return (
                        <div 
                          key={index} 
                          className={`player-card selectable ${isPicking ? 'picking' : ''}`} 
                          onClick={() => handlePlayerPick(player)}
                          style={{ 
                            opacity: isPicking ? 0.6 : 1,
                            cursor: isPicking ? 'wait' : 'pointer'
                          }}
                        >
                          <div className="player-header">
                            <span className="player-name">{player.name}</span>
                            {isPicking && <span className="picking-indicator">⏳</span>}
                          </div>
                          <p className="player-description">{player.description}</p>
                          {isPicking && <div className="picking-overlay">Drafting...</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-players">
                    <p>No players available. Try refreshing or contact support.</p>
                  </div>
                )}
              </div>
            )}

            {settings.mode === 'free_draft' && (
              <div className="custom-player-section">
                <h4>Create Custom Player</h4>
                <div className="custom-player-form">
                  <input
                    type="text"
                    placeholder="Player name"
                    value={customPlayerName}
                    onChange={(e) => setCustomPlayerName(e.target.value)}
                    maxLength={100}
                  />
                  <textarea
                    placeholder="Player description (abilities, background, etc.)"
                    value={customPlayerDescription}
                    onChange={(e) => setCustomPlayerDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                  <button 
                    onClick={handleCustomPlayer}
                    disabled={!customPlayerName.trim() || !customPlayerDescription.trim()}
                    className="btn btn-primary"
                  >
                    Draft Custom Player
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Last Pick Display */}
        {draftState.lastPick && (
          <div className="last-pick">
            <h4>Latest Pick</h4>
            <div className="pick-info">
              <strong>{draftState.lastPick.player.name}</strong> was drafted by{' '}
              {draftState.lastPick.by === playerId ? 'You' : 'Opponent'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftInterface;