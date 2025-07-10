import React, { useState, useEffect } from 'react';
import type { DraftSettings, Team, Player } from '../types';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

interface DraftInterfaceProps {
  settings: DraftSettings;
  teams: Team[];
  onDraftComplete: (teams: Team[]) => void;
}

const DraftInterface: React.FC<DraftInterfaceProps> = ({ settings, teams, onDraftComplete }) => {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [customPlayerName, setCustomPlayerName] = useState('');
  const [customPlayerDescription, setCustomPlayerDescription] = useState('');
  const [draftedTeams, setDraftedTeams] = useState<Team[]>(teams);
  const { generatePlayers, isLoading, error } = useClaudeAPI();

  const totalRounds = settings.playersPerTeam;
  const maxPlayersPerTeam = settings.playersPerTeam;

  useEffect(() => {
    if (settings.mode === 'ai_curated') {
      loadAIGeneratedPlayers();
    }
  }, [settings]);

  const loadAIGeneratedPlayers = async () => {
    try {
      const players = await generatePlayers(
        settings.scenario.name, 
        settings.teamCount * settings.playersPerTeam + 10 // Extra options
      );
      setAvailablePlayers(players);
    } catch (err) {
      console.error('Failed to generate players:', err);
    }
  };

  const getCurrentTeam = () => draftedTeams[currentTeamIndex];

  const addCustomPlayer = () => {
    if (!customPlayerName.trim()) return;

    const newPlayer: Player = {
      id: `custom_${Date.now()}`,
      name: customPlayerName.trim(),
      description: customPlayerDescription.trim() || undefined,
      type: 'user_created'
    };

    draftPlayer(newPlayer);
    setCustomPlayerName('');
    setCustomPlayerDescription('');
  };

  const draftPlayer = (player: Player) => {
    const currentTeam = getCurrentTeam();
    
    if (currentTeam.players.length >= maxPlayersPerTeam) return;

    // Add player to current team
    const updatedTeams = draftedTeams.map(team => 
      team.id === currentTeam.id 
        ? { ...team, players: [...team.players, player] }
        : team
    );

    setDraftedTeams(updatedTeams);

    // Remove from available players if it was AI generated
    if (settings.mode === 'ai_curated') {
      setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
    }

    // Check if draft is complete BEFORE advancing
    const isDraftFinished = updatedTeams.every(team => team.players.length === maxPlayersPerTeam);
    
    if (isDraftFinished) {
      // Draft is complete, don't advance
      return;
    }

    // Move to next team/round
    advanceDraft();
  };

  const advanceDraft = () => {
    const nextTeamIndex = (currentTeamIndex + 1) % settings.teamCount;
    
    if (nextTeamIndex === 0) {
      // Completed a full round
      const nextRound = currentRound + 1;
      if (nextRound > totalRounds) {
        // Draft is complete
        onDraftComplete(draftedTeams);
        return;
      }
      setCurrentRound(nextRound);
    }
    
    setCurrentTeamIndex(nextTeamIndex);
  };

  const removePlayer = (teamId: string, playerId: string) => {
    const updatedTeams = draftedTeams.map(team => 
      team.id === teamId 
        ? { ...team, players: team.players.filter(p => p.id !== playerId) }
        : team
    );
    setDraftedTeams(updatedTeams);

    // Add back to available players if it was AI generated
    const removedPlayer = draftedTeams
      .find(t => t.id === teamId)?.players
      .find(p => p.id === playerId);
    
    if (removedPlayer && settings.mode === 'ai_curated') {
      setAvailablePlayers(prev => [...prev, removedPlayer]);
    }
  };

  const isDraftComplete = () => {
    return draftedTeams.every(team => team.players.length === maxPlayersPerTeam);
  };

  if (isLoading && availablePlayers.length === 0) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Generating AI players for {settings.scenario.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-interface">
      <div className="card">
        <div className="draft-header">
          <h2>Draft Phase - {settings.scenario.name}</h2>
          <div className="draft-status">
            <span>Round {currentRound} of {totalRounds}</span>
            <span>•</span>
            <span className="current-team">{getCurrentTeam().name}'s Turn</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
            {settings.mode === 'ai_curated' && (
              <button onClick={loadAIGeneratedPlayers} className="btn btn-secondary">
                Retry AI Generation
              </button>
            )}
          </div>
        )}

        <div className="draft-content">
          <div className="draft-area">
            {settings.mode === 'free_draft' ? (
              <div className="custom-player-form">
                <h3>Draft Anyone You Want</h3>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Player name (e.g., Napoleon, Batman, Einstein)"
                    value={customPlayerName}
                    onChange={(e) => setCustomPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomPlayer()}
                  />
                </div>
                <div className="form-group">
                  <textarea
                    placeholder="Brief description (optional - helps AI judge better)"
                    value={customPlayerDescription}
                    onChange={(e) => setCustomPlayerDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <button 
                  onClick={addCustomPlayer}
                  disabled={!customPlayerName.trim()}
                  className="btn btn-primary"
                >
                  Draft Player
                </button>
              </div>
            ) : (
              <div className="ai-player-selection">
                <h3>Choose from AI-Generated Players</h3>
                <div className="available-players">
                  {availablePlayers.map(player => (
                    <div key={player.id} className="player-option">
                      <div className="player-info">
                        <h4>{player.name}</h4>
                        <p>{player.description}</p>
                      </div>
                      <button 
                        onClick={() => draftPlayer(player)}
                        className="btn btn-primary"
                      >
                        Draft
                      </button>
                    </div>
                  ))}
                </div>
                
                {availablePlayers.length === 0 && !isLoading && (
                  <div className="no-players">
                    <p>No more AI-generated players available.</p>
                    <button onClick={loadAIGeneratedPlayers} className="btn btn-secondary">
                      Generate More Players
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="teams-display">
            <h3>Draft Progress</h3>
            <div className="teams-grid">
              {draftedTeams.map((team, index) => (
                <div 
                  key={team.id} 
                  className={`team-card ${index === currentTeamIndex ? 'active' : ''}`}
                >
                  <h4>{team.name}</h4>
                  <div className="team-progress">
                    {team.players.length} / {maxPlayersPerTeam} players
                  </div>
                  
                  <div className="team-players">
                    {team.players.map(player => (
                      <div key={player.id} className="drafted-player">
                        <div className="player-details">
                          <strong>{player.name}</strong>
                          {player.description && (
                            <p className="player-description">{player.description}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => removePlayer(team.id, player.id)}
                          className="remove-btn"
                          title="Remove player"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {/* Empty slots */}
                    {Array.from({ length: maxPlayersPerTeam - team.players.length }).map((_, i) => (
                      <div key={i} className="empty-slot">
                        Empty slot
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isDraftComplete() && (
          <div className="draft-complete">
            <h3>Draft Complete! 🎉</h3>
            <p>All teams have selected their players. Ready to battle?</p>
            <button 
              onClick={() => onDraftComplete(draftedTeams)}
              className="btn btn-success btn-large"
            >
              Start Battle! ⚔️
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftInterface;