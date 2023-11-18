import type { RedisClientType } from 'redis';
import type { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export const setupProfileListener = (
  socket: Socket,
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  client: RedisClientType
) => {
  socket.on('update profile', async (data, callback) => {
    const token = socket.data.token;
    await client.set(`user:${token}`, JSON.stringify(data));
    callback(data);
  });
};
