// Core types for the AI Fantasy Draft app
export interface Player {
  id: string;
  name: string;
  description?: string;
  type: 'user_created' | 'ai_generated';
  stats?: Record<string, number>;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  owner: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'survival' | 'intelligence' | 'social' | 'creative' | 'strategy' | 'philosophy';
  maxPlayers: number;
  evaluationCriteria: string[];
  promptTemplate: string;
  teamRoles?: string[]; // NEW: Define what each team represents
}

export interface Battle {
  id: string;
  scenario: Scenario;
  teams: Team[];
  status: 'pending' | 'simulating' | 'completed';
  result?: BattleResult;
  timestamp: Date;
}

export interface BattleResult {
  winner: string; // team id
  score: Record<string, number>; // team id -> score
  explanation: string;
  breakdown: {
    criteria: string;
    teamScores: Record<string, number>;
    reasoning: string;
  }[];
}

export interface DraftSettings {
  mode: 'free_draft' | 'ai_curated';
  teamCount: number;
  playersPerTeam: number;
  scenario: Scenario;
}

export type DraftPhase = 'setup' | 'drafting' | 'battle' | 'results';