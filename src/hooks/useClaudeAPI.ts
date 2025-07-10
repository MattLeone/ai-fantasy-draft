import { useState, useCallback, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import type { Battle, BattleResult, Player } from '../types';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true // Only for development - move to backend for production
});

export const useClaudeAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Check if API key is loaded
  useEffect(() => {
    if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
      console.error('VITE_ANTHROPIC_API_KEY is not set in environment variables');
      setError('API key not configured. Please check your .env.local file.');
    } else {
      console.log('API key loaded successfully');
    }
  }, []);

  const simulateBattle = useCallback(async (battle: Battle): Promise<BattleResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = buildBattlePrompt(battle);
      
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      const result = parseClaudeResponse(responseText, battle);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generatePlayers = useCallback(async (
    scenario: string, 
    count: number
  ): Promise<Player[]> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Generating players for:', scenario, 'Count:', count);
      
      const prompt = `Generate ${count} interesting and diverse characters/entities that would be compelling in a "${scenario}" scenario. 
      
      For each character, provide:
      - Name
      - Brief description (2-3 sentences)
      - Why they'd be interesting in this scenario
      
      Make them varied in type (historical figures, fictional characters, animals, mythical beings, etc.) and ensure they're balanced - no obviously overpowered choices.
      
      Format as JSON array with objects containing: name, description, type
      
      Example format:
      [
        {"name": "Napoleon Bonaparte", "description": "French military leader known for tactical genius", "type": "historical"},
        {"name": "Batman", "description": "Skilled martial artist and detective with advanced technology", "type": "fictional"}
      ]`;

      console.log('Sending request to Claude...');
      
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      console.log('Claude response received:', response);
      
      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      console.log('Response text:', responseText);
      
      const players = parseGeneratedPlayers(responseText);
      console.log('Parsed players:', players);
      
      return players;
    } catch (err) {
      console.error('Error generating players:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    simulateBattle,
    generatePlayers,
    isLoading,
    error
  };
};

function buildBattlePrompt(battle: Battle): string {
  const { scenario, teams } = battle;
  
  const teamsDescription = teams.map(team => 
    `**${team.name}** (${team.players.length} players):
${team.players.map(p => `- ${p.name}${p.description ? ': ' + p.description : ''}`).join('\n')}`
  ).join('\n\n');

  return `You are judging a fantasy battle simulation. Analyze this matchup objectively and fairly.

**Scenario**: ${scenario.name}
${scenario.description}

**Teams**:
${teamsDescription}

**Evaluation Criteria**: ${scenario.evaluationCriteria.join(', ')}

Please analyze this matchup and determine the winner. Be completely objective - don't favor any team based on order mentioned or personal preference. Consider each team's strengths and weaknesses for this specific scenario.

Provide your response in this JSON format:
{
  "winner": "team_name",
  "explanation": "detailed reasoning for your decision",
  "teamScores": {
    "Team 1": score_out_of_100,
    "Team 2": score_out_of_100
  },
  "breakdown": [
    {
      "criteria": "criteria_name",
      "teamScores": {"Team 1": score, "Team 2": score},
      "reasoning": "explanation"
    }
  ]
}`;
}

function parseClaudeResponse(responseText: string, battle: Battle): BattleResult {
  try {
    // Extract JSON from response if it's wrapped in markdown
    const jsonMatch = responseText.match(/```json\n(.*?)\n```/s) || responseText.match(/\{.*\}/s);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
    
    const parsed = JSON.parse(jsonStr);
    
    return {
      winner: battle.teams.find(t => t.name === parsed.winner)?.id || battle.teams[0].id,
      score: parsed.teamScores || {},
      explanation: parsed.explanation || 'No explanation provided',
      breakdown: parsed.breakdown || []
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    // Fallback parsing if JSON fails
    return {
      winner: battle.teams[0].id,
      score: {},
      explanation: responseText,
      breakdown: []
    };
  }
}

interface GeneratedPlayerData {
  name?: string;
  description?: string;
  type?: string;
}

function parseGeneratedPlayers(responseText: string): Player[] {
  try {
    const jsonMatch = responseText.match(/```json\n(.*?)\n```/s) || responseText.match(/\[.*\]/s);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
    
    const parsed = JSON.parse(jsonStr);
    
    // Ensure parsed is an array
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    return parsed.map((p: GeneratedPlayerData, index: number) => ({
      id: `generated_${index}`,
      name: p.name || `Player ${index + 1}`,
      description: p.description || '',
      type: 'ai_generated' as const
    }));
  } catch (error) {
    console.error('Failed to parse generated players:', error);
    return [];
  }
}