export type Lobby = {
  id: string;
  createdAt: number;
  roomCode: string;
  maxPlayers: number;
  players: User[];
};

export type User = {
  id: string;
  name: string;
  avatar: string;
  roomCode: string;
  socketId: string;
  // isReady is a boolean but redis doesn't support it
  isReady: boolean;
};

interface ServerToClientLobbyEvents {
  rejoinLobby: (lobby: Lobby) => void;
  playerJoinedLobby: (player: User) => void;
  playerReadyLobby: (userId: string, isReady: boolean) => void;
  playerLeftLobby: (userId: string) => void;
}

interface ServerToClientProfileEvents {
  profile: (userData: User) => void;
  showCreateProfile: () => void;
}

interface ServerToClientGameEvents {
  redirectUserToGame: (state: string) => void;
}

export interface ServerToClientEvents
  extends ServerToClientLobbyEvents,
    ServerToClientGameEvents,
    ServerToClientProfileEvents {
  token: (token: string) => void;
  // Add more events as per your application's requirements
}

// CLIENT TO SERVER

interface ClientToServerLobbyEvents {
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
}

interface ClientToServerProfileEvents {}

interface ClientToServerGameEvents {
  newGame: (lobbyId: string, callback: (gameId: string) => void) => void;
  drawFromDeck: (lobbyId: string, userId: string) => void;
}

export interface ClientToServerEvents
  extends ClientToServerLobbyEvents,
    ClientToServerGameEvents,
    ClientToServerProfileEvents {
  updateProfile: (userData: User, callback: (response: User) => void) => void;

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
