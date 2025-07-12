import type { Scenario } from '../types';

export const predefinedScenarios: Scenario[] = [
  {
    id: 'gladiator_arena',
    name: 'The Colosseum Awaits',
    description: 'Ancient Rome\'s greatest gladiatorial tournament. Teams fight for glory, freedom, and the roar of 50,000 spectators. Victory requires more than strength - you need cunning, showmanship, and the favor of the gods.',
    category: 'combat',
    maxPlayers: 5,
    evaluationCriteria: [
      'Combat prowess and fighting technique',
      'Crowd appeal and theatrical flair',
      'Tactical adaptation to different opponents',
      'Mental fortitude under pressure',
      'Strategic use of arena environment'
    ],
    promptTemplate: 'gladiator_arena'
  },
  {
    id: 'survive_hell',
    name: 'Survive in Hell',
    description: 'Both teams are cast into the depths of Hell itself. Demons, fire, brimstone, and endless torment await. Victory goes to whichever team can survive the longest in this realm of eternal punishment and supernatural horror.',
    category: 'survival',
    maxPlayers: 4,
    evaluationCriteria: [
      'Physical and mental resilience under extreme conditions',
      'Adaptation to supernatural threats and environments',
      'Resource management in a hostile realm',
      'Team cohesion under psychological pressure',
      'Creative problem-solving against demonic forces'
    ],
    promptTemplate: 'survive_hell',
    teamRoles: ['The Damned', 'The Forsaken']
  },
  {
    id: 'woo_cleopatra',
    name: 'Win Cleopatra\'s Heart',
    description: 'The most powerful and intelligent woman in ancient history seeks a worthy partner. Teams must court Cleopatra VII through wit, charm, political acumen, and genuine connection. She has rejected Caesar and Antony before - what makes you different?',
    category: 'social',
    maxPlayers: 4,
    evaluationCriteria: [
      'Charisma and personal magnetism',
      'Intellectual discourse and wit',
      'Political savvy and strategic thinking',
      'Cultural sensitivity and emotional intelligence',
      'Authenticity and genuine connection'
    ],
    promptTemplate: 'woo_cleopatra'
  },
  {
    id: 'steal_mona_lisa',
    name: 'Steal the Mona Lisa',
    description: 'The Louvre\'s security is legendary, but the Mona Lisa must be stolen. Teams have 48 hours to plan and execute the perfect heist. Cameras, guards, laser grids, and international authorities stand between you and the world\'s most famous painting.',
    category: 'strategy',
    maxPlayers: 4,
    evaluationCriteria: [
      'Stealth and infiltration capabilities',
      'Strategic planning and execution',
      'Technical expertise and problem-solving',
      'Team coordination under pressure',
      'Adaptability when plans go wrong'
    ],
    promptTemplate: 'steal_mona_lisa',
    teamRoles: ['The Crew', 'The Syndicate']
  },
  {
    id: 'escape_maze',
    name: 'Escape the Maze',
    description: 'Both teams wake up in an enormous, ever-shifting labyrinth designed by an ancient intelligence. The maze changes its layout every hour, contains deadly traps, impossible physics, and mind-bending puzzles. Victory goes to whichever team can navigate to the center first and claim the exit key.',
    category: 'intelligence',
    maxPlayers: 4,
    evaluationCriteria: [
      'Spatial reasoning and navigation skills',
      'Pattern recognition and puzzle-solving ability',
      'Memory and information retention',
      'Adaptability to changing conditions',
      'Leadership and decision-making under pressure'
    ],
    promptTemplate: 'escape_maze',
    teamRoles: ['The Lost', 'The Wanderers']
  }
];

export const getScenarioById = (id: string): Scenario | undefined => {
  return predefinedScenarios.find(scenario => scenario.id === id);
};

export const getScenariosByCategory = (category: string): Scenario[] => {
  return predefinedScenarios.filter(scenario => scenario.category === category);
};