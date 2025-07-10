import type { Scenario } from '../types';

export const predefinedScenarios: Scenario[] = [
  {
    id: 'medieval_combat',
    name: 'Medieval Battlefield',
    description: 'A large-scale medieval battle with swords, shields, and tactical warfare. Victory depends on combat skill, leadership, and tactical intelligence.',
    category: 'combat',
    maxPlayers: 5,
    evaluationCriteria: [
      'Combat expertise and weapon mastery',
      'Leadership and command abilities', 
      'Tactical intelligence and strategy',
      'Physical strength and endurance',
      'Courage and battle experience'
    ],
    promptTemplate: 'medieval_combat'
  },
  {
    id: 'zombie_survival',
    name: 'Zombie Apocalypse Survival',
    description: 'Teams must survive 30 days in a zombie-infested city. Success requires resourcefulness, teamwork, and survival instincts.',
    category: 'survival',
    maxPlayers: 4,
    evaluationCriteria: [
      'Survival skills and resourcefulness',
      'Leadership under pressure',
      'Combat ability against zombies',
      'Intelligence and problem-solving',
      'Teamwork and group cohesion'
    ],
    promptTemplate: 'zombie_survival'
  },
  {
    id: 'scientific_breakthrough',
    name: 'Scientific Research Race',
    description: 'Teams compete to solve a complex scientific problem. The first to achieve a breakthrough wins.',
    category: 'intelligence',
    maxPlayers: 3,
    evaluationCriteria: [
      'Scientific knowledge and expertise',
      'Creative problem-solving ability',
      'Research and analytical skills',
      'Innovation and original thinking',
      'Collaboration and knowledge sharing'
    ],
    promptTemplate: 'scientific_research'
  },
  {
    id: 'social_influence',
    name: 'Social Media Influence Campaign',
    description: 'Teams compete to build the largest and most engaged social media following in 90 days.',
    category: 'social',
    maxPlayers: 4,
    evaluationCriteria: [
      'Charisma and personal appeal',
      'Content creation abilities',
      'Understanding of social trends',
      'Marketing and promotional skills',
      'Network building capabilities'
    ],
    promptTemplate: 'social_influence'
  },
  {
    id: 'creative_challenge',
    name: 'Ultimate Creative Showcase',
    description: 'Teams must create an original artistic masterpiece - combining visual art, music, storytelling, and performance.',
    category: 'creative',
    maxPlayers: 4,
    evaluationCriteria: [
      'Artistic vision and creativity',
      'Technical skill execution',
      'Innovation and originality',
      'Collaborative creative process',
      'Emotional impact and audience appeal'
    ],
    promptTemplate: 'creative_showcase'
  },
  {
    id: 'business_empire',
    name: 'Build a Business Empire',
    description: 'Starting with $10,000, teams compete to build the most valuable company in 5 years.',
    category: 'intelligence',
    maxPlayers: 3,
    evaluationCriteria: [
      'Business acumen and strategy',
      'Leadership and management skills',
      'Innovation and market insight',
      'Risk assessment abilities',
      'Networking and relationship building'
    ],
    promptTemplate: 'business_empire'
  },
  {
    id: 'wilderness_survival',
    name: 'Wilderness Survival Challenge',
    description: 'Teams are dropped in a remote wilderness with minimal supplies. Survive and thrive for 60 days.',
    category: 'survival',
    maxPlayers: 4,
    evaluationCriteria: [
      'Wilderness survival skills',
      'Physical fitness and endurance',
      'Mental resilience and adaptability',
      'Teamwork and cooperation',
      'Resource management and planning'
    ],
    promptTemplate: 'wilderness_survival'
  },
  {
    id: 'heist_planning',
    name: 'Master Heist Planning',
    description: 'Teams must plan and execute the perfect heist (simulation only!). Most successful plan wins.',
    category: 'intelligence',
    maxPlayers: 5,
    evaluationCriteria: [
      'Strategic planning abilities',
      'Attention to detail',
      'Risk assessment and contingency planning',
      'Technical expertise',
      'Team coordination and timing'
    ],
    promptTemplate: 'heist_planning'
  }
];

export const getScenarioById = (id: string): Scenario | undefined => {
  return predefinedScenarios.find(scenario => scenario.id === id);
};

export const getScenariosByCategory = (category: string): Scenario[] => {
  return predefinedScenarios.filter(scenario => scenario.category === category);
};