import React, { useState, useEffect } from 'react';
import type { Battle, BattleResult } from '../types';

interface ResultsDisplayProps {
  battle: Battle;
  result: BattleResult;
  onRestart: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ battle, result, onRestart }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealStep, setRevealStep] = useState(0);

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    
    // Stagger the reveal of results
    const timer = setTimeout(() => {
      setRevealStep(1);
      setTimeout(() => setRevealStep(2), 1000);
      setTimeout(() => setRevealStep(3), 2000);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getWinnerTeam = () => {
    return battle.teams.find(team => team.id === result.winner);
  };

  const getTeamScore = (teamName: string): number => {
    return result.score[teamName] || 0;
  };

  const getSortedTeams = () => {
    return [...battle.teams].sort((a, b) => {
      const scoreA = getTeamScore(a.name);
      const scoreB = getTeamScore(b.name);
      return scoreB - scoreA;
    });
  };

  const renderWinnerAnnouncement = () => {
    const winner = getWinnerTeam();
    if (!winner) return null;

    return (
      <div className={`winner-announcement ${revealStep >= 1 ? 'revealed' : ''}`}>
        <div className="trophy">🏆</div>
        <h2>Victory!</h2>
        <h3>{winner.name} Wins!</h3>
        <div className="winner-score">
          Final Score: {getTeamScore(winner.name)}/100
        </div>
      </div>
    );
  };

  const renderTeamResults = () => {
    const sortedTeams = getSortedTeams();

    return (
      <div className={`team-results ${revealStep >= 2 ? 'revealed' : ''}`}>
        <h3>Final Standings</h3>
        <div className="standings">
          {sortedTeams.map((team, index) => {
            const isWinner = team.id === result.winner;
            const score = getTeamScore(team.name);
            
            return (
              <div key={team.id} className={`team-result ${isWinner ? 'winner' : ''}`}>
                <div className="rank">#{index + 1}</div>
                <div className="team-info">
                  <h4>{team.name}</h4>
                  <div className="team-roster">
                    {team.players.map((player, playerIndex) => (
                      <span key={player.id} className="player-name">
                        {player.name}
                        {playerIndex < team.players.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="team-score">
                  <div className="score-number">{score}</div>
                  <div className="score-bar">
                    <div 
                      className="score-fill"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDetailedAnalysis = () => {
    return (
      <div className={`detailed-analysis ${revealStep >= 3 ? 'revealed' : ''}`}>
        <h3>AI Analysis</h3>
        
        <div className="explanation-section">
          <h4>Battle Report</h4>
          <p className="explanation-text">{result.explanation}</p>
        </div>

        {result.keyMoments && result.keyMoments.length > 0 && (
          <div className="key-moments-section">
            <h4>⚡ Key Moments</h4>
            <div className="moments-list">
              {result.keyMoments.map((moment, index) => (
                <div key={index} className="moment-item">
                  <div className="moment-header">
                    <div className="moment-number">{index + 1}</div>
                    <h5 className="moment-title">{typeof moment === 'string' ? `Moment ${index + 1}` : moment.title}</h5>
                  </div>
                  <div className="moment-text">{typeof moment === 'string' ? moment : moment.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="scenario-context">
          <h4>Scenario: {battle.scenario.name}</h4>
          <p>{battle.scenario.description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="results-display">
      {showConfetti && <div className="confetti-container" />}
      
      <div className="card">
        <div className="results-content">
          {renderWinnerAnnouncement()}
          
          <div className="results-section">
            {renderTeamResults()}
          </div>
          
          <div className="results-section">
            {renderDetailedAnalysis()}
          </div>
        </div>

        <div className="results-actions">
          <button 
            onClick={onRestart}
            className="btn btn-primary btn-large"
          >
            Start New Battle 🔄
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;