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
    // continue to generate a room code until it's unique
    let unique = false;
    let roomCode = '';

    while (!unique) {
      // generate a room code
      roomCode = randomstring.generate({
        capitalization: 'uppercase',
        length: 6,
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
      console.log('Oh shit', err);
      callback(null);
    }
  });

  socket.on('join lobby', async (roomCode, userId, callback) => {
    // fetch the lobby
    const lobby = await client.GET(`lobby:${roomCode}`);
    const jsonLobby: Lobby = JSON.parse(lobby ?? 'null');

    //fetch the user
    const user = await client.GET(`user:${userId}`);
    const jsonUser = JSON.parse(user ?? 'null');

    const userWithRoomCode = {
      ...jsonUser,
      roomCode,
    };

    client.SET(`user:${userId}`, JSON.stringify(userWithRoomCode));

    if (!lobby) {
      callback(null);
      //console.log(`Lobby with code: ${roomCode} not found`);
      return;
    }

    if (!user) {
      callback(null);
      //console.log(`User with id: ${userId} not found`);
      return;
    }

    //console.log(`lobby players`, jsonLobby.players);

    const mergedLobby = {
      ...jsonLobby,
      players: [...jsonLobby.players, jsonUser],
    };

    //console.log('joining player: ', jsonUser);

    // add the user to the lobby
    await client.SET(`lobby:${roomCode}`, JSON.stringify(mergedLobby));

    callback(mergedLobby);

    // emit to all users in the lobby that a new user has joined
    io.to(roomCode).emit('player joined', jsonUser);

    // join the room
    socket.join(roomCode);
  });

  socket.on(
    'toggle player ready',
    async (isReady, userId, roomCode, callback) => {
      // get the current state
      const data = JSON.parse(
        (await client.GET(`lobby:${roomCode}`)) ?? 'null'
      );

      const updatedLobby = {
        ...data,
        players: data.players.map((player: Player) => {
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
        await client.SET(`lobby:${roomCode}`, JSON.stringify(updatedLobby));
        callback(updatedLobby);
        // emit to lobby
        io.to(roomCode).emit('player ready update', userId, isReady);
      } catch (err) {
        //console.log(err);
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
    console.log(data);
    await setUserData({ client, token: userId, data: userLeftLoby });

    // if this is the last player in the lobby, delete the lobby
    if (data.players.length === 1) {
      console.log('Only one player left, deleting lobby');
      const res = await client.DEL(`lobby:${roomCode}`);
      console.log(res);
      callback(null);
      // remove the lobby from the socket
      socket.leave(roomCode);
      return;
    }
    const updatedLobby = {
      ...data,
      players: data.players.filter((player: Player) => player.id !== userId),
    };

    try {
      await setLobbyData({
        client,
        lobbyCode: roomCode,
        lobbyData: updatedLobby,
      });
      callback(updatedLobby);
      // emit to lobby
      io.to(roomCode).emit('player left', userId);

      // remove the socket
      socket.leave(roomCode);
    } catch (err) {
      //console.log(err);
      callback(null);
    }
  });
};
