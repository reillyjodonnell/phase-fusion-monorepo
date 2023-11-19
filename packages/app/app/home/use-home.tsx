import React from 'react';
import { useUser } from '../contexts/user-context';
import { Lobby } from '../lobby';
import GameManager from '../game-manager';
import { useSocket } from '../contexts/socket-context';

export function useHome() {
  const socket = useSocket();
  const { setUser, user } = useUser();

  const [game, setGame] = React.useState<typeof GameManager | null>(null);
  const [error, setError] = React.useState('');
  const [lobby, setLobby] = React.useState<Lobby | null>(null);
  const [roomCodeInput, setRoomCodeInput] = React.useState('');
  const [showCreateProfile, setShowCreateProfile] = React.useState(false);
  const [canRejoin, setCanRejoin] = React.useState(false);

  React.useEffect(() => {
    function showCreateProfile() {
      setShowCreateProfile(true);
    }
    socket?.on('showCreateProfile', showCreateProfile);

    return () => {
      socket?.off('showCreateProfile', showCreateProfile);
    };
  }, [socket]);

  React.useEffect(() => {
    socket?.on('profile', ({ name = '', id = '', avatar = '', ...rest }) => {
      setUser({ name, id, avatar });
    });
  }, [socket]);

  React.useEffect(() => {
    function rejoinLobby(passed: Lobby) {
      if (passed) {
        setCanRejoin(true);
        setLobby(passed);
      }
    }
    socket?.on('rejoinLobby', rejoinLobby);

    return () => {
      socket?.off('rejoinLobby', rejoinLobby);
    };
  }, [socket, lobby]);

  function returnToMenu() {
    setLobby(null);
  }

  function createLobby() {
    setError('');
    socket?.emit('createLobby', user.id, (lobby) => {
      if (!lobby) {
        setError('Error creating lobby');
        setLobby(null);
        return;
      }
      const { id: lobbyId, roomCode, players } = lobby;
      if (!lobbyId || !roomCode) {
        setError('Error creating lobby');
        setLobby(null);
        return;
      }
      setLobby(lobby);
    });
  }

  function joinLobby(lobby: Lobby) {
    setLobby(lobby);
  }

  return {
    game,
    setGame,
    error,
    setError,
    lobby,
    setLobby,
    roomCodeInput,
    setRoomCodeInput,
    showCreateProfile,
    setShowCreateProfile,
    returnToMenu,
    createLobby,
    joinLobby,
    canRejoin,
  };
}
