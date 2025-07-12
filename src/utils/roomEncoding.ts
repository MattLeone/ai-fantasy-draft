// Utility functions for encoding/decoding room data in URLs (Lichess-style)

export interface RoomConfig {
  scenario: any;
  draftMode: string;
  playersPerTeam: number;
  createdAt: string;
}

export function encodeRoomConfig(config: RoomConfig): string {
  const data = {
    s: config.scenario,
    d: config.draftMode,
    p: config.playersPerTeam,
    t: config.createdAt
  };
  
  const json = JSON.stringify(data);
  const base64 = btoa(json);
  // Make URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeRoomConfig(roomId: string): RoomConfig | null {
  try {
    // Restore base64 padding and chars
    let base64 = roomId.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const json = atob(base64);
    const data = JSON.parse(json);
    
    return {
      scenario: data.s,
      draftMode: data.d,
      playersPerTeam: data.p,
      createdAt: data.t
    };
  } catch (error) {
    console.error('Failed to decode room ID:', error);
    return null;
  }
}

export function generateRoomId(scenario: any, draftMode: string, playersPerTeam: number): string {
  const config: RoomConfig = {
    scenario,
    draftMode,
    playersPerTeam,
    createdAt: new Date().toISOString()
  };
  
  return encodeRoomConfig(config);
}