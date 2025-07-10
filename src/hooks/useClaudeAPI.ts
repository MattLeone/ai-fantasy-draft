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
      
      // Generate MORE characters than needed for better variety
      const extraCharacters = Math.ceil(count * 0.6); // Generate 60% more
      const totalToGenerate = count + extraCharacters;
      
      // Scenario-specific character types that make sense (avoid specific names)
      const scenarioGuidance = {
        'The Colosseum Awaits': {
          focus: 'warriors, fighters, tactical combatants, crowd entertainers, and survival specialists',
          traits: 'combat skills, showmanship, tactical thinking, physical prowess, crowd appeal'
        },
        'The Last Sanctuary': {
          focus: 'survivalists, engineers, medical professionals, crisis leaders, and resourceful innovators',
          traits: 'survival skills, technical expertise, leadership under pressure, resourcefulness, team coordination'
        },
        'The Temporal Crime Scene': {
          focus: 'detectives, strategic masterminds, historical experts, pattern analyzers, and time theorists',
          traits: 'deductive reasoning, strategic thinking, historical knowledge, problem-solving, analytical minds'
        },
        'Win Cleopatra\'s Heart': {
          focus: 'charismatic diplomats, poets, cultural figures, smooth negotiators, and legendary charmers',
          traits: 'charisma, cultural sophistication, diplomatic skills, artistic talent, emotional intelligence'
        },
        'Paint for the Gods': {
          focus: 'artists, musicians, writers, creative visionaries, and innovative minds',
          traits: 'artistic vision, creative innovation, emotional expression, technical mastery, inspirational ability'
        },
        'Hostile Takeover of Evil Corp': {
          focus: 'business strategists, corporate leaders, investigators, negotiators, and competitive masterminds',
          traits: 'business acumen, strategic planning, investigative skills, competitive drive, market understanding'
        },
        'Judgment of Souls': {
          focus: 'moral philosophers, great orators, ethical thinkers, spiritual leaders, and persuasive debaters',
          traits: 'moral reasoning, rhetorical skill, ethical frameworks, philosophical depth, persuasive argumentation'
        },
        'Clash on the Rift': {
          focus: 'strategic gamers, competitive athletes, tactical commanders, quick-thinking adapters, and team coordinators',
          traits: 'strategic thinking, quick reflexes, team coordination, competitive drive, adaptability under pressure'
        }
      };

      // Enhanced variety seeds with more entertainment focus
      const varietySeeds = [
        'Include mix of historical legends, pop culture icons, and compelling fictional characters',
        'Balance serious strategic picks with entertaining TV/movie personalities and game characters', 
        'Mix legendary figures with beloved cartoon characters and video game heroes',
        'Include diverse mix of respected leaders, animated characters, and fantasy figures',
        'Combine historical powerhouses with iconic entertainment personalities and mythical beings',
        'Mix cultural legends with memorable cartoon/anime characters and literary figures',
        'Include both obvious strategic choices and surprisingly entertaining wildcard characters',
        'Balance different time periods with modern entertainment icons and classic archetypes'
      ];

      // Add more entertainment-focused categories
      const entertainmentBoosts = [
        'Include some beloved cartoon characters, video game heroes, or TV personalities',
        'Mix in memorable animated characters, sitcom figures, or gaming legends', 
        'Add entertaining characters from movies, TV shows, cartoons, or video games',
        'Include some fun pop culture figures alongside serious strategic picks',
        'Mix iconic entertainment characters with historical and mythical figures',
        'Add memorable characters from animation, gaming, or popular media'
      ];

      // Get scenario-specific guidance
      const currentScenario = scenarioGuidance[scenario as keyof typeof scenarioGuidance];
      const scenarioFocus = currentScenario?.focus || 'diverse and interesting characters';
      const scenarioTraits = currentScenario?.traits || 'various relevant abilities';

      // Random elements for variety
      const selectedSeed = varietySeeds[Math.floor(Math.random() * varietySeeds.length)];
      const entertainmentBoost = entertainmentBoosts[Math.floor(Math.random() * entertainmentBoosts.length)];
      
      // Enhanced randomness with multiple entropy sources
      const timestamp = Date.now();
      const randomSalt = (timestamp + Math.random() * 10000).toString().slice(-6);
      const varietyBoost = Math.random() > 0.5 ? 'Emphasize unexpected but logical choices' : 'Focus on crowd-pleasing recognizable figures';
      const culturalFocus = ['Western history', 'Eastern traditions', 'Global perspectives', 'Ancient civilizations', 'Modern era', 'Mixed time periods'][Math.floor(Math.random() * 6)];

      const prompt = `Generate ${totalToGenerate} diverse characters specifically suited for a "${scenario}" scenario. 

SCENARIO FOCUS: Prioritize ${scenarioFocus}

KEY TRAITS NEEDED: ${scenarioTraits}

VARIETY DIRECTIVE: ${selectedSeed}

ENTERTAINMENT FACTOR: ${entertainmentBoost}

CULTURAL EMPHASIS: Draw from ${culturalFocus}

APPROACH: ${varietyBoost}

RANDOMNESS SEED: ${randomSalt}

CRITICAL REQUIREMENTS:
- Characters MUST be well-suited to this specific scenario
- Include mix of: historical figures, fictional characters, mythical beings, relevant animals, AND entertaining pop culture figures
- Balance serious strategic picks with fun entertainment characters (cartoons, video games, TV shows, movies)
- Examples of entertaining picks: Master Chief, Peter Griffin, Tyrion Lannister, Mario, Batman, Gordon Ramsay, SpongeBob, etc.
- Ensure each character brings something valuable to THIS specific challenge
- Mix different time periods, cultures, and entertainment mediums
- Avoid repetitive or predictable picks - be creative and varied
- Include characters that will make people smile or get excited to see
- Balance respected figures with beloved entertainment personalities

CHARACTER TYPES TO INCLUDE:
- Historical legends and cultural icons
- Movie/TV characters and animated personalities  
- Video game heroes and literary figures
- Mythical beings and legendary creatures
- Relevant animals and unique concepts
- Entertainment personalities and cartoon characters

FORMAT: Each character should be genuinely relevant to the scenario while being recognizable and entertaining

Format as JSON array:
[
  {"name": "Character Name", "description": "Description emphasizing why they're perfect for THIS scenario", "type": "historical|fictional|mythical|animal|other"}
]

Make it both strategically sound AND entertaining!`;

      console.log('Enhanced generation:', { 
        scenario, 
        totalToGenerate, 
        finalCount: count,
        selectedSeed, 
        entertainmentBoost, 
        varietyBoost, 
        randomSalt 
      });
      console.log('Sending request to Claude...');
      
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000, // Increased for more characters
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      console.log('Claude response received');
      
      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      console.log('Response text length:', responseText.length);
      
      const allPlayers = parseGeneratedPlayers(responseText);
      console.log('Total generated players:', allPlayers.length);
      
      // Randomly select the number we actually need
      const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
      const selectedPlayers = shuffledPlayers.slice(0, count);
      
      console.log('Final selected players count:', selectedPlayers.length);
      
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

  return `You are judging a fantasy battle simulation. Analyze this matchup objectively and fairly.

**Scenario**: ${scenario.name}
${scenario.description}

**Teams**:
${teamsDescription}

**Evaluation Criteria**: ${scenario.evaluationCriteria.join(', ')}

**Additional Considerations**:
- Consider team chemistry: Would these characters work well together or clash?
- Factor in leadership dynamics and personality conflicts
- Teams with great synergy might punch above their weight
- Teams with major conflicts might underperform despite individual talent
- Most teams should have neutral chemistry - only apply significant bonuses/penalties for exceptional cases

**Creative Interpretation Bonus**: Reward creative applications of each character's abilities. Consider unexpected ways their skills could apply to this scenario. Don't automatically favor obviously powerful characters - think about how seemingly weaker characters might use cunning, unique perspectives, or unconventional approaches to succeed.

Please analyze this matchup and determine the winner. Be completely objective - don't favor any team based on order mentioned or personal preference. Consider each team's strengths and weaknesses for this specific scenario.

Provide your response in this JSON format:
{
  "winner": "${teamNames[0]}" or "${teamNames[1]}",
  "explanation": "detailed reasoning for your decision (mention any significant team chemistry factors and creative applications of abilities)",
  "teamScores": {
    "${teamNames[0]}": score_out_of_100,
    "${teamNames[1]}": score_out_of_100
  },
  "breakdown": [
    {
      "criteria": "criteria_name",
      "teamScores": {"${teamNames[0]}": score, "${teamNames[1]}": score},
      "reasoning": "explanation including any synergy effects and creative interpretations"
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
    console.log('=== PARSING START ===');
    console.log('Raw response length:', responseText.length);
    console.log('Raw response preview:', responseText.substring(0, 200) + '...');
    
    // Handle empty or very short responses
    if (!responseText || responseText.trim().length < 10) {
      console.error('Response is empty or too short');
      return [];
    }
    
    // Step 1: Clean up the response - remove markdown code blocks
    let cleanText = responseText.trim();
    
    // Remove ```json and ``` markers more aggressively
    cleanText = cleanText.replace(/^```json\s*/i, '');
    cleanText = cleanText.replace(/^```\s*/, '');
    cleanText = cleanText.replace(/\s*```$/m, '');
    
    console.log('After markdown removal length:', cleanText.length);
    
    // Step 2: Find the JSON array boundaries
    const startBracket = cleanText.indexOf('[');
    const lastBracket = cleanText.lastIndexOf(']');
    
    console.log('Start bracket at:', startBracket, 'End bracket at:', lastBracket);
    
    if (startBracket === -1 || lastBracket === -1 || startBracket >= lastBracket) {
      console.error('No valid JSON array found in response');
      console.error('Full cleaned text:', cleanText);
      // Don't return empty array, let's try a fallback
      
      // Fallback: try the original regex approach
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const fallbackJson = jsonMatch[1] || jsonMatch[0];
        console.log('Trying fallback parsing with:', fallbackJson.substring(0, 100) + '...');
        try {
          const parsed = JSON.parse(fallbackJson);
          if (Array.isArray(parsed)) {
            return parsed.map((p: GeneratedPlayerData, index: number) => ({
              id: `generated_${Date.now()}_${index}`,
              name: p.name || `Player ${index + 1}`,
              description: p.description || '',
              type: 'ai_generated' as const
            }));
          }
        } catch (fallbackError) {
          console.error('Fallback parsing also failed:', fallbackError);
        }
      }
      
      return [];
    }
    
    const jsonStr = cleanText.substring(startBracket, lastBracket + 1);
    console.log('Extracted JSON length:', jsonStr.length);
    console.log('JSON preview:', jsonStr.substring(0, 200) + '...');
    
    // Step 3: Parse the JSON
    const parsed = JSON.parse(jsonStr);
    
    if (!Array.isArray(parsed)) {
      console.error('Parsed result is not an array:', typeof parsed);
      return [];
    }
    
    console.log('Successfully parsed', parsed.length, 'players');
    
    // Step 4: Convert to Player objects
    return parsed.map((p: GeneratedPlayerData, index: number) => ({
      id: `generated_${Date.now()}_${index}`,
      name: p.name || `Player ${index + 1}`,
      description: p.description || '',
      type: 'ai_generated' as const
    }));
    
  } catch (error) {
    console.error('Failed to parse generated players:', error);
    console.error('Original response was:', responseText);
    return [];
  }
}