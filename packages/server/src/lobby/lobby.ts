import randomstring from 'randomstring';
import { generateId } from '../helpers/helper';
import { IOType, RedisClientType, SocketType } from '..';
import {
  getLobbyData,
  getUserData,
  setLobbyData,
  setUserData,
} from '../helpers/redis';
import { Lobby, User } from '@phase-fusion/shared/socket';
export const setupLobbyListeners = (
  socket: SocketType,
  io: IOType,
  client: RedisClientType
) => {
  socket.on('createLobby', async (userId, callback) => {
    console.log('createLobby');
    // continue to generate a room code until it's unique
    let unique = false;
    let roomCode = '';

    while (!unique) {
      // generate a room code
      roomCode = randomstring.generate({
        capitalization: 'uppercase',
        length: 6,
        charset: 'alphabetic',
      });
      // check if that room code exists within the database
      const exists = await getLobbyData({ client, lobbyCode: roomCode });

      if (!exists) {
        unique = true;
      }
    }

    // fetch the user's profile
    const user = await getUserData({ client, token: userId });

    if (!user) {
      callback(null);
      return;
    }

    const formattedUser: User = {
      ...user,
      isReady: false,
      roomCode,
    };

    await setUserData({ client, token: userId, data: formattedUser });

    const lobby: Lobby = {
      id: generateId(),
      createdAt: Date.now(),
      roomCode,
      maxPlayers: 2,
      players: [formattedUser],
    };

    try {
      await setLobbyData({ client, lobbyCode: roomCode, lobbyData: lobby });
      callback(lobby);
      // put socket in a room with that id
      socket.join(roomCode);
    } catch (err) {
      callback(null);
    }
  });

  socket.on('joinLobby', async (roomCode, userId, callback) => {
    const lobby = await getLobbyData({
      client,
      lobbyCode: roomCode,
    });

    const userWithRoomCode: Partial<User> = {
      roomCode,
    };

    await setUserData({ client, token: userId, data: userWithRoomCode });

    const user = await getUserData({ client, token: userId });

    if (!lobby) {
      callback(null);
      return;
    }

    if (!user) {
      callback(null);
      return;
    }

    const mergedLobby = {
      ...lobby,
      players: [...lobby.players, user],
    };

    await setLobbyData({ client, lobbyCode: roomCode, lobbyData: mergedLobby });

    callback(mergedLobby);

    // emit to all users in the lobby that a new user has joined
    io.to(roomCode).emit('playerJoinedLobby', user);

    // join the room
    socket.join(roomCode);
  });

  socket.on(
    'togglePlayerReady',
    async (isReady, userId, roomCode, callback) => {
      // get the current state
      const data = await getLobbyData({ client, lobbyCode: roomCode });

      if (!data) throw new Error('Lobby not found');

      const updatedLobby = {
        ...data,
        players: data.players.map((player) => {
          if (player.id === userId) {
            return {
              ...player,
              isReady,
            };
          }
          return player;
        }),
      };
      try {
        await setLobbyData({
          client,
          lobbyCode: roomCode,
          lobbyData: updatedLobby,
        });
        callback(updatedLobby);
        // emit to lobby
        io.to(roomCode).emit('playerReadyLobby', userId, isReady);
      } catch (err) {
        callback(null);
      }
    }
  );

  socket.on('leaveLobby', async (userId, roomCode, callback) => {
    const data = await getLobbyData({ client, lobbyCode: roomCode });

    if (!data) throw new Error('Lobby not found');

    const userLeftLoby: Partial<User> = {
      roomCode: '',
    };
    await setUserData({ client, token: userId, data: userLeftLoby });

    // if this is the last player in the lobby, delete the lobby
    if (data.players.length === 1) {
      await client.DEL(`lobby:${roomCode}`);
      callback(null);
      // remove the lobby from the socket
      socket.leave(roomCode);
      return;
    }
    const updatedLobby = {
      ...data,
      players: data.players.filter((player) => player.id !== userId),
    };

    try {
      await setLobbyData({
        client,
        lobbyCode: roomCode,
        lobbyData: updatedLobby,
      });
      callback(updatedLobby);
      // emit to lobby
      io.to(roomCode).emit('playerLeftLobby', userId);

      // remove the socket
      socket.leave(roomCode);
    } catch (err) {
      callback(null);
    }
  });
};
