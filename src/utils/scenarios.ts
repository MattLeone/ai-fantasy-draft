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
    id: 'galactic_empire',
    name: 'Galactic Empire',
    description: 'Lead your team to colonize the galaxy. Establish settlements, manage resources, explore new worlds, handle alien encounters, and build the most impressive stellar civilization.',
    category: 'strategy',
    maxPlayers: 4,
    evaluationCriteria: [
      'Territory expansion and strategic positioning',
      'Technological advancement and innovation',
      'Population growth and societal stability',
      'Resource management and sustainability',
      'Diplomatic relations with alien species',
      'Cultural achievements and quality of life',
      'Military readiness and conflict resolution',
      'Long-term civilization sustainability'
    ],
    promptTemplate: 'galactic_empire',
    teamRoles: ['The Pioneers', 'The Colonists']
  }
];

export const getScenarioById = (id: string): Scenario | undefined => {
  return predefinedScenarios.find(scenario => scenario.id === id);
};

export const getScenariosByCategory = (category: string): Scenario[] => {
  return predefinedScenarios.filter(scenario => scenario.category === category);
};