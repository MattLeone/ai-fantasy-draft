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
    id: 'end_of_world',
    name: 'The Last Sanctuary',
    description: 'Civilization has collapsed. Two rival bunkers discover they each have limited resources and failing life support systems. Teams compete to see whose shelter can survive the longest through superior resource management, strategic decisions, and crisis leadership.',
    category: 'survival',
    maxPlayers: 4,
    evaluationCriteria: [
      'Resource management and rationing strategies',
      'Crisis leadership and group morale',
      'Technical problem-solving under pressure',
      'Long-term planning and sustainability',
      'Conflict resolution and team cohesion'
    ],
    promptTemplate: 'end_of_world',
    teamRoles: ['Bunker Alpha Survivors', 'Bunker Beta Survivors']
  },
  {
    id: 'time_detective',
    name: 'The Temporal Crime Scene',
    description: 'History is being sabotaged across multiple timelines. One team plays master criminals executing elaborate time heists and paradoxes. The other team are time cops trying to stop them and repair the timeline. Can the criminals break history before the detectives catch them?',
    category: 'intelligence',
    maxPlayers: 3,
    evaluationCriteria: [
      'Strategic planning and execution',
      'Understanding of cause-and-effect across time',
      'Creative problem-solving under pressure',
      'Historical knowledge and cultural awareness',
      'Ability to predict and counter opponent moves'
    ],
    promptTemplate: 'time_detective',
    teamRoles: ['Time Criminals', 'Time Police']
  },
  {
    id: 'seduce_cleopatra',
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
    promptTemplate: 'seduce_cleopatra'
  },
  {
    id: 'gods_canvas',
    name: 'Paint for the Gods',
    description: 'Mount Olympus announces a divine art competition. The winner becomes the new Muse of Creativity. Teams must create a masterpiece that captures the essence of human experience and moves immortal beings to tears.',
    category: 'creative',
    maxPlayers: 4,
    evaluationCriteria: [
      'Artistic vision and originality',
      'Technical mastery of chosen medium',
      'Emotional depth and human truth',
      'Innovation that transcends mortal limitations',
      'Collaborative synergy between team members'
    ],
    promptTemplate: 'gods_canvas',
    teamRoles: ['The Visionaries', 'The Masters']
  },
  {
    id: 'corporate_takeover',
    name: 'Hostile Takeover of Evil Corp',
    description: 'Megalomaniac Industries controls 60% of the global economy and is planning something sinister. Your startup has 6 months to outmaneuver them, expose their conspiracy, and save capitalism from itself. David vs. Goliath has never had higher stakes.',
    category: 'strategy',
    maxPlayers: 3,
    evaluationCriteria: [
      'Business strategy and market manipulation',
      'Corporate espionage and information warfare',
      'Public relations and narrative control',
      'Financial innovation and resource allocation',
      'Ethical leadership under corrupt pressures'
    ],
    promptTemplate: 'corporate_takeover'
  },
  {
    id: 'lol_rift',
    name: 'Clash on the Rift',
    description: 'Two teams of five face off in the ultimate MOBA showdown on Summoner\'s Rift. Victory requires perfect coordination, strategic thinking, mechanical skill, and the ability to adapt under pressure. Destroy the enemy Nexus before they destroy yours.',
    category: 'strategy',
    maxPlayers: 5,
    evaluationCriteria: [
      'Strategic coordination and team fighting',
      'Individual mechanical skill and game sense',
      'Adaptability and decision-making under pressure',
      'Communication and team synergy',
      'Map awareness and objective control'
    ],
    promptTemplate: 'lol_rift',
    teamRoles: ['Blue Side Team', 'Red Side Team']
  },
  {
    id: 'afterlife_trial',
    name: 'Judgment of Souls',
    description: 'Humanity faces the ultimate tribunal with every deity from every religion as judges. One team serves as prosecutor, arguing why humanity deserves extinction for its sins and failures. The other team serves as defense, arguing why humanity deserves redemption and a second chance.',
    category: 'philosophy',
    maxPlayers: 3,
    evaluationCriteria: [
      'Moral reasoning and ethical frameworks',
      'Rhetorical skill and persuasive argumentation',
      'Understanding of human nature and history',
      'Ability to address counterarguments effectively',
      'Wisdom and philosophical depth'
    ],
    promptTemplate: 'afterlife_trial',
    teamRoles: ['Prosecution Team', 'Defense Team']
  }
];

export const getScenarioById = (id: string): Scenario | undefined => {
  return predefinedScenarios.find(scenario => scenario.id === id);
};

export const getScenariosByCategory = (category: string): Scenario[] => {
  return predefinedScenarios.filter(scenario => scenario.category === category);
};