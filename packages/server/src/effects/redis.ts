// // effects/redis.ts

// import { RedisClientType, createClient } from 'redis';
// let redisClient: RedisClientType | null = null;

// (async () => {
//   redisClient = createClient({
//     url: 'redis://localhost:6379/0',
//   });

//   redisClient.on('error', (error) => console.error(`Error : ${error}`));

//   await redisClient.connect();
// })();

// export { redisClient };

// export const redisEffects = {
//   write(key: string, value: {}): Promise<string> {
//     return new Promise((resolve, reject) => {
//       // Ensure that the value is serialized before storing.

//       client.hSet(key, value, (error, result) => {
//         if (error) {
//           console.error('Redis write error:', error);
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       });
//     });
//   },

//   read: (key: string): Promise<string | null> => {
//     return new Promise((resolve, reject) => {
//       client.get(key, (error, result) => {
//         if (error) {
//           console.error('Redis read error:', error);
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       });
//     });
//   },
// };
