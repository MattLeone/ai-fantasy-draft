import { useState, useEffect, useRef } from 'react';
import type { DraftPhase, DraftSettings, Team, Battle, BattleResult } from './types';
import { predefinedScenarios } from './utils/scenarios';
import ScenarioSelector from './components/ScenarioSelector';
import DraftInterface from './components/DraftInterface';
import BattleSimulator from './components/BattleSimulator.tsx';
import ResultsDisplay from './components/ResultsDisplay.tsx'; 
import { useRoom } from './hooks/useRoom';
import './App.css';

function App() {
  const [currentPhase, setCurrentPhase] = useState<DraftPhase>('setup');
  const [draftSettings, setDraftSettings] = useState<DraftSettings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [, setRoomId] = useState<string | null>(null);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const lastJoinedRoomId = useRef<string | null>(null);
  const { room, isLoading: roomLoading, error: roomError, joinRoom, startPolling, startDraft, storeBattleResults, getBattleStatus, playerId } = useRoom();

  useEffect(() => {
    // Check if someone is joining via room link (path-based: /room/{roomId})
    const path = window.location.pathname;
    const roomMatch = path.match(/^\/room\/(.+)$/);
    
    if (roomMatch && lastJoinedRoomId.current !== roomMatch[1]) {
      const roomParam = roomMatch[1];
      setRoomId(roomParam);
      setIsJoiningRoom(true);
      lastJoinedRoomId.current = roomParam;
      
      console.log('Attempting to join room:', roomParam);
      console.log('Current player ID before join:', sessionStorage.getItem('playerId'));
      
      // Join the room
      joinRoom(roomParam)
        .then((roomData) => {
          console.log('Successfully joined room:', roomData);
          // Start polling for updates
          const cleanup = startPolling(roomParam);
          // Store cleanup function for later use
          return cleanup;
        })
        .catch((error) => {
          console.error('Failed to join room:', error);
        });
    }
  }, []);

  // Watch for room status changes and auto-transition to draft
  useEffect(() => {
    if (room && room.status === 'drafting' && room.draftState && isJoiningRoom) {
      // Room draft has started, transition both players to draft phase
      const settings: DraftSettings = {
        mode: room.draftMode as 'free_draft' | 'ai_curated',
        teamCount: 2,
        playersPerTeam: room.playersPerTeam,
        scenario: room.scenario
      };
      handleScenarioSelect(settings);
      setIsJoiningRoom(false);
    }
  }, [room, isJoiningRoom]);

  // Poll for battle results when guest is waiting
  useEffect(() => {
    if (currentPhase === 'draft-complete' && room && room.hostId !== playerId) {
      const roomMatch = window.location.pathname.match(/^\/room\/(.+)$/);
      if (roomMatch) {
        const pollBattleResults = async () => {
          try {
            const battleData = await getBattleStatus(roomMatch[1]);
            if (battleData && battleData.status === 'completed') {
              setBattleResult(battleData.result);
              setCurrentBattle(battleData.battle);
              setCurrentPhase('results');
            }
          } catch (error) {
            console.error('Error polling battle results:', error);
          }
        };

        // Poll every 3 seconds
        const pollInterval = setInterval(pollBattleResults, 3000);
        
        return () => clearInterval(pollInterval);
      }
    }
  }, [currentPhase, room, playerId, getBattleStatus]);

  const handleScenarioSelect = (settings: DraftSettings) => {
    setDraftSettings(settings);
    setCurrentPhase('drafting');
    
    // Initialize teams with scenario-specific roles if available
    const teamRoles = settings.scenario.teamRoles;
    const initialTeams: Team[] = Array.from({ length: settings.teamCount }, (_, i) => ({
      id: `team_${i + 1}`,
      name: teamRoles ? teamRoles[i] : `Team ${i + 1}`,
      players: [],
      owner: `Player ${i + 1}`
    }));
    setTeams(initialTeams);
  };

  const handleDraftComplete = (completedTeams: Team[]) => {
    console.log('Draft completed with teams:', completedTeams); // Debug
    setTeams(completedTeams);
    
    // Check if we're in a multiplayer room
    const path = window.location.pathname;
    const roomMatch = path.match(/^\/room\/(.+)$/);
    
    if (roomMatch && room) {
      // In multiplayer room - check if user is host
      if (room.hostId === playerId) {
        // Host can start battle immediately
        setCurrentPhase('battle');
        if (draftSettings) {
          const battle: Battle = {
            id: `battle_${Date.now()}`,
            scenario: draftSettings.scenario,
            teams: completedTeams,
            status: 'pending',
            timestamp: new Date()
          };
          setCurrentBattle(battle);
        }
      } else {
        // Guest waits for host to start battle
        setCurrentPhase('draft-complete');
      }
    } else {
      // Single player or non-room mode
      setCurrentPhase('battle');
      if (draftSettings) {
        const battle: Battle = {
          id: `battle_${Date.now()}`,
          scenario: draftSettings.scenario,
          teams: completedTeams,
          status: 'pending',
          timestamp: new Date()
        };
        setCurrentBattle(battle);
      }
    }
  };

  const handleBattleComplete = async (result: BattleResult) => {
    setBattleResult(result);
    setCurrentPhase('results');

    // If in multiplayer room, store results for other player to see
    const path = window.location.pathname;
    const roomMatch = path.match(/^\/room\/(.+)$/);
    
    if (roomMatch && currentBattle) {
      try {
        await storeBattleResults(roomMatch[1], currentBattle, result);
      } catch (error) {
        console.error('Failed to store battle results:', error);
      }
    }
  };

  const handleRestart = () => {
    setCurrentPhase('setup');
    setDraftSettings(null);
    setTeams([]);
    setCurrentBattle(null);
    setBattleResult(null);
    setRoomId(null);
    setIsJoiningRoom(false);
    lastJoinedRoomId.current = null;
    
    // Navigate back to home page
    window.history.pushState({}, '', '/');
  };

  const renderCurrentPhase = () => {
    // If someone is joining via room link, show joining screen
    if (isJoiningRoom) {
      if (roomError) {
        return (
          <div className="card">
            <h2>❌ Failed to Join Room</h2>
            <div className="error-message">
              <p>{roomError}</p>
            </div>
            <button onClick={() => window.location.href = '/'} className="btn btn-primary">
              Back to Home
            </button>
          </div>
        );
      }

      if (roomLoading || !room) {
        return (
          <div className="card">
            <h2>Joining Battle Room</h2>
            <div className="loading">
              <div className="spinner"></div>
              <p>Connecting to room...</p>
            </div>
          </div>
        );
      }

      // Successfully joined, show room details
      return (
        <div className="card">
          <h2>✅ Joined Battle Room</h2>
          <div className="scenario-description">
            <p><em>{room.scenario.description}</em></p>
          </div>
          <div className="room-details">
            <h3>Battle Details:</h3>
            <p><strong>Scenario:</strong> {room.scenario.name}</p>
            <p><strong>Players per team:</strong> {room.playersPerTeam}</p>
            <p><strong>Draft mode:</strong> {room.draftMode === 'free_draft' ? 'Free Draft' : 'AI Curated'}</p>
            <p><strong>Players:</strong> {room.players.length}/2</p>
          </div>
          
          {room.status === 'waiting' && (
            <div>
              <div className="waiting-indicator">
                <div className="pulse-dot"></div>
                <span>Waiting for host to start the battle...</span>
              </div>
              {import.meta.env.DEV && (
                <button 
                  onClick={() => {
                    // For testing, just start the draft with current settings
                    const settings: DraftSettings = {
                      mode: room.draftMode as 'free_draft' | 'ai_curated',
                      teamCount: 2,
                      playersPerTeam: room.playersPerTeam,
                      scenario: room.scenario
                    };
                    handleScenarioSelect(settings);
                    setIsJoiningRoom(false);
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🧪 Start Draft (Skip 2nd Player)
                </button>
              )}
            </div>
          )}
          
          {room.status === 'ready' && (
            <div>
              <p>✅ Both players ready!</p>
              {room.hostId === playerId ? (
                <button 
                  className="btn btn-success btn-large"
                  onClick={async () => {
                    try {
                      const settings: DraftSettings = {
                        mode: room.draftMode as 'free_draft' | 'ai_curated',
                        teamCount: 2,
                        playersPerTeam: room.playersPerTeam,
                        scenario: room.scenario
                      };
                      
                      // Start draft for the room (both players)
                      await startDraft(room.id, settings);
                    } catch (error) {
                      console.error('Failed to start draft:', error);
                    }
                  }}
                >
                  Start Draft Battle ⚔️ (Host)
                </button>
              ) : (
                <p>Waiting for host to start the battle...</p>
              )}
            </div>
          )}
        </div>
      );
    }

    switch (currentPhase) {
      case 'setup':
        return (
          <ScenarioSelector 
            scenarios={predefinedScenarios}
            onScenarioSelect={handleScenarioSelect}
          />
        );
      
      case 'drafting':
        return draftSettings ? (
          <DraftInterface
            settings={draftSettings}
            teams={teams}
            onDraftComplete={handleDraftComplete}
          />
        ) : null;
      
      case 'draft-complete':
        return (
          <div className="card">
            <h2>🏆 Draft Complete!</h2>
            <div className="draft-summary">
              <h3>Final Teams</h3>
              {teams.map((team) => (
                <div key={team.id} className="team-summary">
                  <h4>{team.name} ({team.players.length} players)</h4>
                  {team.players.length > 0 ? (
                    <ul>
                      {team.players.map((player, index) => (
                        <li key={index}>
                          <strong>{player.name}</strong>
                          {player.description && <span> - {player.description}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No players drafted</p>
                  )}
                </div>
              ))}
            </div>
            {room && room.hostId === playerId ? (
              <button 
                className="btn btn-success btn-large"
                onClick={() => {
                  setCurrentPhase('battle');
                  if (draftSettings) {
                    const battle: Battle = {
                      id: `battle_${Date.now()}`,
                      scenario: draftSettings.scenario,
                      teams: teams,
                      status: 'pending',
                      timestamp: new Date()
                    };
                    setCurrentBattle(battle);
                  }
                }}
              >
                Start Battle ⚔️ (Host)
              </button>
            ) : (
              <div className="waiting-indicator">
                <div className="pulse-dot"></div>
                <span>Waiting for host to start the battle...</span>
              </div>
            )}
          </div>
        );
      
      case 'battle':
        return currentBattle ? (
          <BattleSimulator
            battle={currentBattle}
            onBattleComplete={handleBattleComplete}
          />
        ) : null;
      
      case 'results':
        return battleResult && currentBattle ? (
          <ResultsDisplay
            battle={currentBattle}
            result={battleResult}
            onRestart={handleRestart}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏆 AI Fantasy Draft</h1>
        <p>Draft your ultimate team and battle AI-powered scenarios</p>
      </header>
      
      <div className="phase-indicator">
        <div className={`phase-step ${currentPhase === 'setup' ? 'active' : ''}`}>
          1. Setup
        </div>
        <div className={`phase-step ${currentPhase === 'drafting' ? 'active' : ''}`}>
          2. Draft
        </div>
        <div className={`phase-step ${currentPhase === 'battle' ? 'active' : ''}`}>
          3. Battle
        </div>
        <div className={`phase-step ${currentPhase === 'results' ? 'active' : ''}`}>
          4. Results
        </div>
      </div>
      <main className="app-main">
        {renderCurrentPhase()}
      </main>
    </div>
  );
}

export default App;