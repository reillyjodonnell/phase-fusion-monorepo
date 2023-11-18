import type { RedisClientType } from 'redis';
import type { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import randomstring from 'randomstring';
import { generateId } from '../helpers/helper';

export const setupLobbyListeners = (
  socket: Socket,
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  client: RedisClientType
) => {
  socket.on('create lobby', async (userId, callback) => {
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
      const exists = await client.GET(`lobby:${roomCode}`);

      if (!exists) {
        unique = true;
      }
    }

    // fetch the user's profile
    const user = await client.GET(`user:${userId}`);

    //console.log(user);

    const jsonUser = JSON.parse(user ?? 'null');

    const userWithRoomCode = {
      ...jsonUser,
      roomCode,
    };

    client.SET(`user:${userId}`, JSON.stringify(userWithRoomCode));

    const formattedUser = {
      ...jsonUser,
      isReady: false,
    };

    const lobby: Lobby = {
      id: generateId(),
      createdAt: Date.now(),
      roomCode,
      maxPlayers: 2,
      players: [formattedUser],
    };

    try {
      await client.SET(`lobby:${roomCode}`, JSON.stringify(lobby));
      callback(lobby);
      // put socket in a room with that id
      socket.join(roomCode);
    } catch (err) {
      //console.log('Oh shit', err);
      callback(null, null);
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

  socket.on('leave lobby', async (userId, roomCode, callback) => {
    // get the current state
    const data = JSON.parse((await client.GET(`lobby:${roomCode}`)) ?? 'null');

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
      players: data.players.filter((player: Player) => player.id !== userId),
    };

    const user = JSON.parse((await client.GET(`user:${userId}`)) ?? 'null');

    const userLeftLoby = {
      ...user,
      roomCode: null,
    };

    await client.SET(`user:${userId}`, JSON.stringify(userLeftLoby));
    try {
      await client.SET(`lobby:${roomCode}`, JSON.stringify(updatedLobby));
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
