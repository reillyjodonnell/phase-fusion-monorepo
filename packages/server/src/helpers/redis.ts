import type { createClient } from 'redis';
import type { Lobby, User } from '@phase-fusion/shared/socket';

export type TokenData = {
  id: string;
  socketId?: string;
};

type RedisClient = ReturnType<typeof createClient>;

interface SetUserTokenProps {
  client: RedisClient;
  token: string;
  data: Partial<User>;
}

export async function setUserData({
  client,
  token,
  data,
}: SetUserTokenProps): Promise<void> {
  // redis doesn't support boolean values so we have to convert to a string
  if (typeof data.isReady === 'boolean') {
    //@ts-ignore
    data.isReady = data.isReady.toString();
  }
  await client.hSet(`user:${token}`, data);
}

interface GetUserDataProps {
  client: RedisClient;
  token: string;
}

export async function getUserData({
  client,
  token,
}: GetUserDataProps): Promise<User | null> {
  try {
    const data = await client.hGetAll(`user:${token}`);
    ///@ts-ignore
    if (data && typeof data.isReady === 'string') {
      ///@ts-ignore
      data.isReady = data.isReady === 'true';
    }
    return data && Object.keys(data).length > 0 ? (data as User) : null;
  } catch (err) {
    console.error(err);
    throw new Error('Failed at getUserData');
  }
}

interface SetLobbyDataProps {
  client: RedisClient;
  lobbyCode: string;
  lobbyData: Partial<Lobby>;
}

export async function setLobbyData({
  client,
  lobbyCode,
  lobbyData,
}: SetLobbyDataProps): Promise<void> {
  // Convert data to a format suitable for hSet (flattened key-value pairs)
  try {
    await client.set(`lobby:${lobbyCode}`, JSON.stringify(lobbyData));
  } catch (err) {}
}

interface DeleteLobbyDataProps {
  client: RedisClient;
  lobbyCode: string;
}

export async function deleteLobbyData({
  client,
  lobbyCode,
}: DeleteLobbyDataProps): Promise<void> {
  // Use the Redis 'del' command to remove the lobby data
  await client.del(`lobby:${lobbyCode}`);
}

interface GetLobbyDataProps {
  client: RedisClient;
  lobbyCode: string;
}

export async function getLobbyData({
  client,
  lobbyCode,
}: GetLobbyDataProps): Promise<Lobby | null> {
  try {
    const data = await client.get(`lobby:${lobbyCode}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.log('GetLobbyData error: ' + err);
  }
}
