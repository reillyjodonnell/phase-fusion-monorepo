export type Lobby = {
  id: string;
  createdAt: number;
  roomCode: string;
  maxPlayers: number;
  players: Player[];
};

export type Player = {
  id: string;
  name: string;
  avatar: string;
  isReady: boolean;
};

export interface ServerToClientEvents {
  token: (token: string) => void;
  showCreateProfile: () => void;
  rejoinLobby: (lobby: Lobby) => void;
  profile: (userData: UserData) => void;
  playerJoined: (player: Player) => void;
  playerReadyUpdate: (userId: string, isReady: boolean) => void;
  playerLeft: (userId: string) => void;
  // Add more events as per your application's requirements
}

export interface ClientToServerEvents {
  createLobby: (
    userId: string,
    callback: (lobby: Lobby | null) => void
  ) => void;
  joinLobby: (
    roomCode: string,
    userId: string,
    callback: (lobby: Lobby | null) => void
  ) => void;
  togglePlayerReady: (
    isReady: boolean,
    userId: string,
    roomCode: string,
    callback: (lobby: Lobby | null) => void
  ) => void;
  leaveLobby: (
    userId: string,
    roomCode: string,
    callback: (lobby: Lobby | null) => void
  ) => void;
  // Add other client-to-server events as needed
}
export interface InterServerEvents {
  ping: () => void;
  // Add more inter-server events if necessary
}
export interface SocketData {
  token: string;
  // Include other custom data properties as required
}
