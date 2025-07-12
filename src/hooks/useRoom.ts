import { useState, useCallback, useEffect } from 'react';

interface RoomPlayer {
  id: string;
  joinedAt: string;
}

interface Room {
  id: string;
  scenario: any;
  draftMode: string;
  playersPerTeam: number;
  players: RoomPlayer[];
  status: 'waiting' | 'ready' | 'drafting' | 'battling' | 'completed';
  createdAt: string;
  hostId?: string;
  draftState: any;
}

export const useRoom = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  // Generate a unique player ID for this session
  const getPlayerId = useCallback(() => {
    let playerId = sessionStorage.getItem('playerId');
    if (!playerId) {
      playerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('playerId', playerId);
    }
    return playerId;
  }, []);

  const createRoom = useCallback(async (scenario: any, draftMode: string, playersPerTeam: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const playerId = getPlayerId();
      
      const response = await fetch('/api/room-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario,
          draftMode,
          playersPerTeam,
          creatorId: playerId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRoom(data.room);
      
      return { room: data.room, shareUrl: data.shareUrl };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getPlayerId]);

  const joinRoom = useCallback(async (roomId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const playerId = getPlayerId();
      
      const response = await fetch('/api/room-join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          playerId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRoom(data.room);
      return data.room;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getPlayerId]);

  const getRoomStatus = useCallback(async (roomId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/room-status?roomId=${roomId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRoom(data.room);
      return data.room;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get room status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Silent room status check (doesn't trigger loading state)
  const silentRoomCheck = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/room-status?roomId=${roomId}`);

      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
        return data.room;
      }
    } catch (error) {
      console.error('Silent polling error:', error);
    }
  }, []);

  // Poll room status for real-time updates (simple polling for now)
  const startPolling = useCallback((roomId: string, interval = 5000) => {
    const poll = async () => {
      try {
        await silentRoomCheck(roomId);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const intervalId = setInterval(poll, interval);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }, [silentRoomCheck]);

  // Utility to decode room ID back to config (for joining via URL)
  const decodeRoomConfig = useCallback((roomId: string) => {
    try {
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
  }, []);

  // Start draft (host only)
  const startDraft = useCallback(async (roomId: string, draftSettings: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const playerId = getPlayerId();
      
      const response = await fetch('/api/room-start-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          playerId,
          draftSettings
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Update room status to trigger polling update
      await getRoomStatus(roomId);
      return data.draftState;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start draft';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getPlayerId, getRoomStatus]);

  // Get draft status
  const getDraftStatus = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/draft-status?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        return data.draftState;
      }
    } catch (error) {
      console.error('Error getting draft status:', error);
    }
    return null;
  }, []);

  // Make draft pick
  const makeDraftPick = useCallback(async (roomId: string, player: any, pickType = 'ai_generated') => {
    setIsLoading(true);
    setError(null);

    try {
      const playerId = getPlayerId();
      
      const response = await fetch('/api/draft-pick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          playerId,
          player,
          pickType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.draftState;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to make draft pick';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getPlayerId]);

  // Store generated players in draft
  const storeGeneratedPlayers = useCallback(async (roomId: string, players: any[]) => {
    try {
      const response = await fetch('/api/draft-generate-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          players
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.draftState;
    } catch (err) {
      console.error('Failed to store generated players:', err);
      throw err;
    }
  }, []);

  // Store battle results
  const storeBattleResults = useCallback(async (roomId: string, battle: any, battleResult: any) => {
    try {
      const response = await fetch('/api/battle-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          battle,
          battleResult
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to store battle results:', err);
      throw err;
    }
  }, []);

  // Get battle status
  const getBattleStatus = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/battle-status?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        return data.battleData;
      }
    } catch (error) {
      console.error('Error getting battle status:', error);
    }
    return null;
  }, []);

  return {
    room,
    isLoading,
    error,
    createRoom,
    joinRoom,
    getRoomStatus,
    startPolling,
    startDraft,
    getDraftStatus,
    makeDraftPick,
    storeGeneratedPlayers,
    storeBattleResults,
    getBattleStatus,
    decodeRoomConfig,
    playerId: getPlayerId()
  };
};