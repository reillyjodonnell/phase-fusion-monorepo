import { IOType, SocketType } from '..';
import { RedisClientType } from '..';
import { setUserData } from '../helpers/redis';

export const setupProfileListener = (
  socket: SocketType,
  io: IOType,
  client: RedisClientType
) => {
  socket.on('updateProfile', async (data, callback) => {
    console.log('updateProfile');
    const token = socket.data.token;
    await setUserData({ client, token, data });
    callback(data);
    console.log('Called callback with: ', data.name);
  });
};
