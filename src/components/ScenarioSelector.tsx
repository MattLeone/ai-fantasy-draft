import React, { useState } from 'react';
import type{ Scenario, DraftSettings } from '../types';
import { useRoom } from '../hooks/useRoom';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  onScenarioSelect: (settings: DraftSettings) => void;
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ scenarios, onScenarioSelect }) => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [draftMode, setDraftMode] = useState<'free_draft' | 'ai_curated'>('ai_curated');
  const [playersPerTeam, setPlayersPerTeam] = useState(3);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { room, isLoading, error, createRoom } = useRoom();

  // Determine room state based on room data
  const getRoomState = () => {
    if (!shareUrl) return 'none';
    if (isLoading && !room) return 'created';
    if (shareUrl && room) {
      if (room.status === 'waiting') return 'waiting';
      if (room.status === 'ready') return 'ready';
    }
    // If we have a shareUrl but no room data, assume it's waiting
    if (shareUrl && !room && !isLoading) return 'waiting';
    return 'none';
  };

  const handleScenarioClick = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setPlayersPerTeam(Math.min(playersPerTeam, scenario.maxPlayers));
  };


  const handleCreateRoom = async () => {
    if (!selectedScenario) return;

    try {
      const result = await createRoom(selectedScenario, draftMode, playersPerTeam);
      
      // Navigate creator to the room URL immediately
      window.location.href = result.shareUrl;
    } catch (error) {
      console.error('Failed to create room:', error);
      setShareUrl(null);
    }
  };

  const handleStartDraft = () => {
    if (!selectedScenario) return;

    const settings: DraftSettings = {
      mode: draftMode,
      teamCount: 2, // Always 2 players
      playersPerTeam,
      scenario: selectedScenario
    };

    onScenarioSelect(settings);
  };

  const copyRoomLink = () => {
    if (shareUrl) {
      const roomLink = `${window.location.origin}${shareUrl}`;
      navigator.clipboard.writeText(roomLink);
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'combat': return '⚔️';
      case 'survival': return '🏕️';
      case 'intelligence': return '🧠';
      case 'social': return '💋';
      case 'creative': return '🎨';
      case 'strategy': return '🎮';
      case 'philosophy': return '⚖️';
      default: return '🎯';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'combat': return '#e53e3e';
      case 'survival': return '#38a169';
      case 'intelligence': return '#3182ce';
      case 'social': return '#d53f8c';
      case 'creative': return '#9f7aea';
      case 'strategy': return '#d69e2e';
      case 'philosophy': return '#4a5568';
      default: return '#4a5568';
    }
  };

  return (
    <div className="scenario-selector">
      <div className="card">
        <h2>Choose Your Battle Scenario</h2>
        <p>Select a scenario that will test your drafted team's abilities</p>
        
        <div className="scenarios-grid">
          {scenarios.map((scenario) => (
            <div 
              key={scenario.id}
              className={`scenario-card ${selectedScenario?.id === scenario.id ? 'selected' : ''}`}
              onClick={() => handleScenarioClick(scenario)}
            >
              <div className="scenario-header">
                <span className="scenario-emoji">{getCategoryEmoji(scenario.category)}</span>
                <span 
                  className="scenario-category"
                  style={{ color: getCategoryColor(scenario.category) }}
                >
                  {scenario.category.toUpperCase()}
                </span>
              </div>
              
              <h3>{scenario.name}</h3>
              <p className="scenario-description">{scenario.description}</p>
              
              <div className="scenario-meta">
                <span>Max {scenario.maxPlayers} players per team</span>
              </div>
              
              <div className="evaluation-criteria">
                <strong>Key Factors:</strong>
                <ul>
                  {scenario.evaluationCriteria.slice(0, 3).map((criteria, index) => (
                    <li key={index}>{criteria}</li>
                  ))}
                  {scenario.evaluationCriteria.length > 3 && (
                    <li>+ {scenario.evaluationCriteria.length - 3} more...</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedScenario && (
        <div className="card">
          <h2>Draft Settings</h2>
          
          <div className="settings-grid">
            <div className="setting-group">
              <label>Draft Mode</label>
              <div className="draft-mode-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="free_draft"
                    checked={draftMode === 'free_draft'}
                    onChange={(e) => setDraftMode(e.target.value as 'free_draft' | 'ai_curated')}
                  />
                  <span>Free Draft</span>
                  <small>Draft anyone you can think of</small>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    value="ai_curated"
                    checked={draftMode === 'ai_curated'}
                    onChange={(e) => setDraftMode(e.target.value as 'free_draft' | 'ai_curated')}
                  />
                  <span>AI Curated</span>
                  <small>Choose from AI-generated options</small>
                </label>
              </div>
            </div>

            <div className="setting-group">
              <label>Game Type</label>
              <div className="game-type-info">
                <span>2-Player Draft Battle</span>
                <small>Draft against another player online</small>
              </div>
            </div>

            <div className="setting-group">
              <label>Players per Team</label>
              <select 
                value={playersPerTeam} 
                onChange={(e) => setPlayersPerTeam(parseInt(e.target.value))}
              >
                {Array.from({ length: selectedScenario.maxPlayers }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num} Player{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="draft-summary">
            <h3>Draft Summary</h3>
            <p>
              <strong>{selectedScenario.name}</strong> - 2 players with {playersPerTeam} characters each
            </p>
            <p>
              Mode: <strong>{draftMode === 'free_draft' ? 'Free Draft' : 'AI Curated'}</strong>
            </p>
          </div>

          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
            </div>
          )}

          {getRoomState() === 'none' && (
            <button 
              className="btn btn-primary btn-large"
              onClick={handleCreateRoom}
            >
              Create Battle Room 🚀
            </button>
          )}

          {getRoomState() === 'created' && (
            <div className="room-creation">
              <div className="loading">
                <div className="spinner"></div>
                <p>Creating battle room...</p>
              </div>
            </div>
          )}

          {getRoomState() === 'waiting' && (
            <div className="room-creation">
              <div className="room-link-section">
                <h3>Battle Room Created!</h3>
                <p>Share this link with your opponent:</p>
                <div className="room-link">
                  <input 
                    type="text" 
                    readOnly 
                    value={shareUrl ? `${window.location.origin}${shareUrl}` : ''}
                    className="room-link-input"
                  />
                  <button onClick={copyRoomLink} className="btn btn-secondary">
                    📋 Copy Link
                  </button>
                </div>
                <p className="room-instructions">
                  Send this link to your opponent. Waiting for them to join...
                </p>
                <div className="waiting-indicator">
                  <div className="pulse-dot"></div>
                  <span>Waiting for opponent...</span>
                </div>
              </div>
            </div>
          )}

          {getRoomState() === 'ready' && (
            <div className="room-creation">
              <div className="room-ready">
                <h3>✅ Opponent Joined!</h3>
                <p>Both players are ready. Time to draft!</p>
                <button 
                  className="btn btn-success btn-large"
                  onClick={handleStartDraft}
                >
                  Start Draft Battle ⚔️
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScenarioSelector;