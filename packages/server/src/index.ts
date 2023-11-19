import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { createClient } from 'redis';

import { getLobbyData, getUserData, setUserData } from './helpers/redis';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  User,
} from '@phase-fusion/shared/socket';
import { setupProfileListener } from './profile/profile';
import { setupLobbyListeners } from './lobby/lobby';
import { setupGameListeners } from './game/game';

export type SocketType = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
export type IOType = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

const client = createRedisClient();
// generate a type from the client variable
export type RedisClientType = typeof client;
const io: IOType = new Server({});

io.use(tokenMiddleware);
io.on('connection', handleConnection);

io.listen(3000);

function createRedisClient() {
  const client = createClient({
    legacyMode: false,
  });
  client.connect().catch((err) => console.error('Redis server not running!'));
  handleRedisEvents(client);
  return client;
}

function handleRedisEvents(client: RedisClientType) {
  client.on('connect', () => console.log('Connected to Redis'));
  client.on('error', (err) => console.error(`Redis error: ${err}`));
}

function tokenMiddleware(socket: SocketType, next: any) {
  let token = socket.handshake.auth['token'];
  if (!token) {
    token = uuid();
    socket.emit('token', token);
    setUserData({ client, token, data: { id: token } });
  }
  socket.data.token = token;
  next();
}

async function handleConnection(socket: SocketType) {
  console.log('a user connected');
  const token = socket.data.token || uuid();
  const userData = await getUserData({ client, token });
  // if userData is null this fn will return; otherwise it will continue
  const isNew = await isNewUser(userData);

  if (isNew) {
    handleNewUser(socket, token);
  } else {
    await handleExistingUser(socket, userData!, token);
  }
  console.log('Setting up listeners');
  setupProfileListener(socket, io, client);
  setupLobbyListeners(socket, io, client);
  setupGameListeners(socket, io, client);

  socket.on('disconnect', () => handleDisconnection(socket));
}

async function handleNewUser(socket: SocketType, token: string) {
  console.log("handleNewUser's token: " + token);
  await setUserData({
    client,
    token,
    data: { id: token, socketId: socket.id },
  });
  socket.emit('showCreateProfile');
}

async function handleExistingUser(
  socket: Socket,
  userData: User,
  token: string
) {
  await rejoinLobbyIfApplicable(socket, userData);
  await updateSocketIdIfChanged(socket, userData, token);
  emitUserProfile(socket, userData);
}

async function rejoinLobbyIfApplicable(socket: Socket, userData: User) {
  if (userData.roomCode) {
    const lobby = await getLobbyData({ client, lobbyCode: userData.roomCode });
    if (lobby) {
      socket.join(userData.roomCode);
      socket.emit('rejoinLobby', lobby);
    }
  }
}

function emitUserProfile(socket: Socket, userData: User) {
  socket.emit('profile', userData);
}

async function updateSocketIdIfChanged(
  socket: Socket,
  userData: User,
  token: string
) {
  if (userData.socketId !== socket.id) {
    const updatedUserData = {
      ...userData,
      socketId: socket.id,
      id: socket.data.token,
    };
    await setUserData({ client, token, data: updatedUserData });
  }
}

async function handleDisconnection(socket: Socket) {
  console.log('user disconnected');
  const token = socket.handshake.auth['token'];
  console.log("user's token: " + token);
  await setUserData({
    client,
    token: socket.data.token,
    data: { socketId: '' },
  });
}

async function isNewUser(userData: User | null) {
  return !userData?.name ?? true;
  // ... other logic for handling existing users ...
}
