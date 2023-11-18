import type { createClient } from 'redis';
import type { Lobby } from '@phase-fusion/shared/socket';

export type User = {
  id: string;
  name: string;
  avatar: string;
  roomCode: string;
  socketId: string;
  isReady: boolean;
};

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
  // Convert data to a format suitable for hSet (flattened key-value pairs)
  const flattenedData = Object.entries(data).flat();
  await client.hSet(`user:${token}`, flattenedData);
}

interface GetUserDataProps {
  client: RedisClient;
  token: string;
}

export async function getUserData({
  client,
  token,
}: GetUserDataProps): Promise<User | null> {
  const data = await client.hGetAll(`user:${token}`);
  return data && Object.keys(data).length > 0 ? (data as User) : null;
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

  await client.set(`lobby:${lobbyCode}`, JSON.stringify(lobbyData));
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
  const data = await client.get(`lobby:${lobbyCode}`);
  return data ? JSON.parse(data) : null;
}
