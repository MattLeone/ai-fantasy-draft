import React, { useState, useEffect } from 'react';
import type { Battle, BattleResult } from '../types';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

interface BattleSimulatorProps {
  battle: Battle;
  onBattleComplete: (result: BattleResult) => void;
}

const BattleSimulator: React.FC<BattleSimulatorProps> = ({ battle, onBattleComplete }) => {
  const [battleStatus, setBattleStatus] = useState<'ready' | 'simulating' | 'complete'>('ready');
  const [simulationStep, setSimulationStep] = useState(0);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const { simulateBattle, isLoading, error } = useClaudeAPI();

  const simulationSteps = [
    "Analyzing team compositions...",
    "Evaluating scenario conditions...",
    "Running battle simulation...",
    "Calculating final results...",
    "Battle complete!"
  ];

  useEffect(() => {
    let interval: number;
        
    if (battleStatus === 'simulating') {
      interval = setInterval(() => {
        setSimulationStep(prev => {
          if (prev < simulationSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [battleStatus]);

  const startBattle = async () => {
    setBattleStatus('simulating');
    setSimulationStep(0);

    try {
      const result = await simulateBattle(battle);
      setBattleResult(result);
      setBattleStatus('complete');
      
      // Small delay to show the final step
      setTimeout(() => {
        onBattleComplete(result);
      }, 2000);
    } catch (err) {
      setBattleStatus('ready');
      console.error('Battle simulation failed:', err);
    }
  };

  const renderTeamPreview = () => (
    <div className="teams-preview">
      {battle.teams.map((team) => (
        <div key={team.id} className="team-preview">
          <h3>{team.name}</h3>
          <div className="team-roster">
            {team.players.map(player => (
              <div key={player.id} className="player-card">
                <div className="player-name">{player.name}</div>
                {player.description && (
                  <div className="player-description">{player.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderScenarioInfo = () => (
    <div className="scenario-info">
      <h3>⚔️ {battle.scenario.name}</h3>
      <p className="scenario-description">{battle.scenario.description}</p>
      
      <div className="evaluation-criteria">
        <h4>Victory will be determined by:</h4>
        <ul>
          {battle.scenario.evaluationCriteria.map((criteria, index) => (
            <li key={index}>{criteria}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderBattleAnimation = () => (
    <div className="battle-animation">
      <div className="battle-arena">
        <div className="team-side left">
          <div className="team-label">{battle.teams[0]?.name}</div>
          <div className="team-icons">
            {battle.teams[0]?.players.map((player) => (
              <div key={player.id} className={`fighter-icon ${battleStatus === 'simulating' ? 'fighting' : ''}`}>
                🥊
              </div>
            ))}
          </div>
        </div>

        <div className="battle-center">
          <div className="vs-indicator">VS</div>
          {battleStatus === 'simulating' && (
            <div className="battle-effects">
              <div className="explosion">💥</div>
              <div className="sparks">✨</div>
            </div>
          )}
        </div>

        <div className="team-side right">
          <div className="team-label">{battle.teams[1]?.name}</div>
          <div className="team-icons">
            {battle.teams[1]?.players.map((player) => (
              <div key={player.id} className={`fighter-icon ${battleStatus === 'simulating' ? 'fighting' : ''}`}>
                🥊
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="simulation-status">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((simulationStep + 1) / simulationSteps.length) * 100}%` }}
          />
        </div>
        <p className="status-text">{simulationSteps[simulationStep]}</p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="card">
        <div className="error-state">
          <h2>Battle Simulation Error</h2>
          <p>Something went wrong during the battle simulation:</p>
          <div className="error-message">{error}</div>
          <button onClick={startBattle} className="btn btn-primary">
            Retry Battle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-simulator">
      <div className="card">
        <h2>Battle Arena</h2>
        
        {renderScenarioInfo()}
        
        {battleStatus === 'ready' && (
          <>
            {renderTeamPreview()}
            
            <div className="battle-controls">
              <p>Teams are assembled and ready for battle!</p>
              <button 
                onClick={startBattle}
                disabled={isLoading}
                className="btn btn-success btn-large"
              >
                {isLoading ? 'Preparing Battle...' : 'Begin Battle! ⚔️'}
              </button>
            </div>
          </>
        )}

        {battleStatus === 'simulating' && renderBattleAnimation()}

        {battleStatus === 'complete' && battleResult && (
          <div className="battle-complete">
            <h3>Battle Complete! 🎉</h3>
            <p>The AI has finished analyzing the battle. Preparing results...</p>
            <div className="loading">
              <div className="spinner"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleSimulator;