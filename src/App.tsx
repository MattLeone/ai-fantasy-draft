import { useState } from 'react';
import type { DraftPhase, DraftSettings, Team, Battle, BattleResult } from './types';
import { predefinedScenarios } from './utils/scenarios';
import ScenarioSelector from './components/ScenarioSelector';
import DraftInterface from './components/DraftInterface';
import BattleSimulator from './components/BattleSimulator.tsx';
import ResultsDisplay from './components/ResultsDisplay.tsx'; 
import './App.css';

function App() {
  console.log('Environment check:', {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    allEnvVars: import.meta.env
  });
  const [currentPhase, setCurrentPhase] = useState<DraftPhase>('setup');
  const [draftSettings, setDraftSettings] = useState<DraftSettings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

  const handleScenarioSelect = (settings: DraftSettings) => {
    setDraftSettings(settings);
    setCurrentPhase('drafting');
    
    // Initialize teams
    const initialTeams: Team[] = Array.from({ length: settings.teamCount }, (_, i) => ({
      id: `team_${i + 1}`,
      name: `Team ${i + 1}`,
      players: [],
      owner: `Player ${i + 1}`
    }));
    setTeams(initialTeams);
  };

  const handleDraftComplete = (completedTeams: Team[]) => {
    setTeams(completedTeams);
    setCurrentPhase('battle');
    
    // Create battle
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
  };

  const handleBattleComplete = (result: BattleResult) => {
    setBattleResult(result);
    setCurrentPhase('results');
  };

  const handleRestart = () => {
    setCurrentPhase('setup');
    setDraftSettings(null);
    setTeams([]);
    setCurrentBattle(null);
    setBattleResult(null);
  };

  const renderCurrentPhase = () => {
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