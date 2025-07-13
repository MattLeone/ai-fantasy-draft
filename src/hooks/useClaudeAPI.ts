import { useState, useCallback } from 'react';
import type { Battle, BattleResult, Player } from '../types';

export const useClaudeAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateBattle = useCallback(async (battle: Battle): Promise<BattleResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = buildBattlePrompt(battle);
      
      const response = await fetch('/api/simulate-battle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = parseClaudeResponse(data.responseText, battle);
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
      
      // Generate large pool for variety
      const totalToGenerate = count * 5; // Generate 5x more, randomly select what we need
      

      const prompt = `Generate ${totalToGenerate} random characters from any source imaginable.

DO NOT try to match them to the scenario "${scenario}" - just generate interesting variety.

Mix strong and weak, famous and obscure, serious and silly, good and bad. Include some that may have second order benefits or drawbacks.

Provide neutral descriptions.

Format as JSON array:
[
  {"name": "Character Name", "description": "Neutral description of their abilities and background"}
]`;

      console.log('Generating random characters:', totalToGenerate, 'for scenario:', scenario);
      
      const response = await fetch('/api/generate-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          scenario, 
          count: totalToGenerate,
          prompt 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const allPlayers = parseGeneratedPlayers(data.responseText);
      
      // Randomly select the number we actually need from the large pool
      const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
      const selectedPlayers = shuffledPlayers.slice(0, count);
      
      console.log(`Selected ${selectedPlayers.length} from ${allPlayers.length} generated characters`);
      
      return selectedPlayers;
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

  // Get team names for consistent JSON response
  const teamNames = teams.map(team => team.name);

  return `You are a master storyteller and battle commentator. Create a VIVID, DRAMATIC simulation of this conflict with cinematic detail.

**Scenario**: ${scenario.name}
${scenario.description}

**Teams**:
${teamsDescription}

**Your Mission**: 
Tell the story of this battle through SPECIFIC, DRAMATIC moments. Focus on creative character interactions, unexpected strategies, and cinematic turning points. Be imaginative about how these characters would actually work together or clash.

**Storytelling Requirements**:
- Create 4-6 CONCISE key moments (2-3 sentences each)
- Show exactly HOW characters use their unique abilities
- Include surprising character synergies and creative applications  
- Highlight tactical decisions and adaptations
- Keep descriptions tight and impactful - no lengthy exposition
- Consider realistic team chemistry - who leads? who clashes? who surprises everyone?

Provide your response in this format:
{
  "winner": "${teamNames[0]}" or "${teamNames[1]}",
  "explanation": "A compelling narrative explaining WHY this team won. Focus on the decisive factors and overall story arc.",
  "teamScores": {
    "${teamNames[0]}": score_out_of_100,
    "${teamNames[1]}": score_out_of_100
  },
  "keyMoments": [
    {
      "title": "Opening Gambit",
      "description": "Detailed description of how the battle begins, which characters take initiative, first tactical moves"
    },
    {
      "title": "The Unexpected Play", 
      "description": "A surprising character does something creative or a hidden synergy emerges"
    },
    {
      "title": "Turning Point",
      "description": "The moment that shifts momentum, including specific character actions and decisions"
    },
    {
      "title": "Final Clash",
      "description": "The climactic moment that decides the victor, with vivid detail of the decisive actions"
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
      keyMoments: parsed.keyMoments || []
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    // Fallback parsing if JSON fails
    return {
      winner: battle.teams[0].id,
      score: {},
      explanation: responseText,
      keyMoments: []
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
    // Remove markdown code blocks
    const cleanText = responseText.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/m, '');
    
    // Find JSON array
    const startBracket = cleanText.indexOf('[');
    const lastBracket = cleanText.lastIndexOf(']');
    
    if (startBracket === -1 || lastBracket === -1 || startBracket >= lastBracket) {
      console.error('Invalid JSON structure in response');
      return [];
    }
    
    const jsonStr = cleanText.substring(startBracket, lastBracket + 1);
    const parsed = JSON.parse(jsonStr);
    
    if (!Array.isArray(parsed)) {
      console.error('Response is not an array');
      return [];
    }
    
    return parsed.map((p: GeneratedPlayerData, index: number) => ({
      id: `generated_${Date.now()}_${index}`,
      name: p.name || `Player ${index + 1}`,
      description: p.description || '',
      type: 'ai_generated' as const
    }));
    
  } catch (error) {
    console.error('Failed to parse generated players:', error);
    return [];
  }
}