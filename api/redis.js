import { Redis } from '@upstash/redis';

// Initialize Redis client
// You'll need to set these environment variables in Vercel:
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

// Environment variables loaded successfully

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Helper functions for room management
export async function getRoomPlayers(roomId) {
  try {
    const players = await redis.get(`room:${roomId}:players`);
    return players || [];
  } catch (error) {
    console.error('Error getting room players:', error);
    return [];
  }
}

export async function addPlayerToRoom(roomId, player, isHost = false) {
  try {
    const players = await getRoomPlayers(roomId);
    
    // Check if player already exists
    if (!players.find(p => p.id === player.id)) {
      players.push(player);
      // Store with 1 hour expiration
      await redis.set(`room:${roomId}:players`, players, { ex: 3600 });
      
      // Store host ID separately if this is the host
      if (isHost) {
        await redis.set(`room:${roomId}:host`, player.id, { ex: 3600 });
      }
    }
    
    return players;
  } catch (error) {
    console.error('Error adding player to room:', error);
    return [];
  }
}

export async function getRoomHost(roomId) {
  try {
    const hostId = await redis.get(`room:${roomId}:host`);
    return hostId;
  } catch (error) {
    console.error('Error getting room host:', error);
    return null;
  }
}

export async function getRoomDraftState(roomId) {
  try {
    const draftState = await redis.get(`room:${roomId}:draft`);
    return draftState;
  } catch (error) {
    console.error('Error getting room draft state:', error);
    return null;
  }
}

export async function removePlayerFromRoom(roomId, playerId) {
  try {
    const players = await getRoomPlayers(roomId);
    const updatedPlayers = players.filter(p => p.id !== playerId);
    
    if (updatedPlayers.length === 0) {
      // Remove empty room
      await redis.del(`room:${roomId}:players`);
    } else {
      await redis.set(`room:${roomId}:players`, updatedPlayers, { ex: 3600 });
    }
    
    return updatedPlayers;
  } catch (error) {
    console.error('Error removing player from room:', error);
    return [];
  }
}

export { redis };