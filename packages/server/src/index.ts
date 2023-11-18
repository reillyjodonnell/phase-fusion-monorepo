import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { createClient } from 'redis';
import { setupProfileListener } from './profile/profile';
import { setupLobbyListeners } from './lobby/lobby';
import { setupGameListeners } from './game/game';
import { getLobbyData, getUserData, setUserData } from './helpers/redis';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@phase-fusion/shared/socket';

const client = createClient();

async function main() {
  try {
    await client.connect();
  } catch (err) {
    console.error('Redis server not running!');
  }
}
main();

client.on('connect', (socket) => {
  console.log('Connected!');
});

// Log any error that may occur to the console
client.on('error', (err: string) => {
  if (err.includes('Error: connect ECONNREFUSED')) {
    console.error('Redis server not running!');
  }
  //console.log(`Error:${err}`);
});

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>({});

io.use((socket, next) => {
  let token = socket.handshake.auth['token'];
  // if they don't have a token assign them one
  if (!token) {
    token = uuid();
    //console.log('token doesnt exist. Emitting token event to client');
    socket.emit('token', token);
    // write to redis their token
    setUserData({ client, token, data: { id: token } });
  }

  socket.data.token = token;
  next();
});

io.on('connection', async (socket) => {
  console.log('a user connected');
  // find out if the user needs to rejoin an existing game or if they neeed to start a new one
  // find their profile if it exists & provide their profile
  const userData = await getUserData({ client, token: socket.data.token });
  console.log(userData);
  if (!userData) {
    console.log('NEW USER');
    await setUserData({
      client,
      token: socket.data.token,
      data: { id: socket.data.token, socketId: socket.id },
    });

    socket.emit('showCreateProfile');
    return;
  }

  if (userData.roomCode) {
    // fetch the data for that lobby
    const lobby = await getLobbyData({ client, lobbyCode: userData.roomCode });
    if (lobby) {
      socket.join(userData.roomCode);
      socket.emit('rejoinLobby', lobby);
    }
  }

  socket.emit('profile', userData);

  if (!userData.name) {
    socket.emit('showCreateProfile');
  }

  // check if their socket.id matches what's stored
  if (userData.socketId !== socket.id) {
    const updated = {
      ...userData,
      socketId: socket.id,
      id: socket.data.token,
    };
    // if it doesn't match then we need to update it
    setUserData({ client, token: socket.data.token, data: updated });
  }

  socket.on('disconnect', async () => {
    console.log('user disconnected');
    let token = socket.handshake.auth['token'];

    console.log("here's that users token: " + token);

    // remove the users sockedId from their profile
    // get the rest of the properties:

    await setUserData({
      client,
      token: socket.data.token,
      data: { socketId: '' },
    });
  });

  //@ts-ignore
  setupProfileListener(socket, io, client);
  //@ts-ignore
  setupLobbyListeners(socket, io, client);
  //@ts-ignore
  setupGameListeners(socket, io, client);
});
io.listen(3000);
