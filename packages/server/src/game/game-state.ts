import { type Socket } from 'socket.io';
import { type Card } from './utils/helpers';
import { produce } from 'immer';
import { RedisClientType } from '..';

type Pile = Card[][];

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  pile: Pile;
  points: number;
}

export function getDefaultPlayerState() {
  return {
    id: '',
    name: '',
    hand: [],
    phase: 1,
    pile: [],
    points: 0,
  };
}

export interface GameState {
  id: string | null;
  discardCard: Card | null;
  deck: Card[];
  lobby: Player[];
  currentPlayerIndex: number;
  roomCode: string | null;
  isJoinable: boolean;
}

// default game state
export const getDefaultGameState = () => ({
  id: null,
  discardCard: null,
  deck: [],
  lobby: [],
  roomCode: null,
  currentPlayerIndex: -1,
  isJoinable: false,
});

export const getGameState = async (
  redisClient: RedisClientType,
  roomCode: string
) => {
  const gameStateJSON = await redisClient.get(`game:${roomCode}`);
  return gameStateJSON ? JSON.parse(gameStateJSON) : null;
};

export const setGameState = async (
  redisClient: RedisClientType,
  newState: GameState
) => {
  const gameStateJSON = JSON.stringify(newState);
  await redisClient.set(`game:${newState.roomCode}`, gameStateJSON);
};

export const updateDiscardCard = ({
  state,
  card,
}: {
  state: GameState;
  card: Card | null;
}) => {
  const newState = produce(state, (draftState) => {
    draftState.discardCard = card;
  });
  return newState;
};

export const updateDeck = ({
  state,
  deck,
}: {
  state: GameState;
  deck: Card[];
}) => {
  const newState = produce(state, (draftState) => {
    draftState.deck = deck;
  });
  return newState;
};

export const updatePlayersHand = ({
  state,
  hand,
  playerIndex,
}: {
  state: GameState;
  hand: Card[];
  playerIndex: number;
}) => {
  const newState = produce(state, (draftState) => {
    const lobby = draftState.lobby;
    const player = lobby?.[playerIndex];
    if (!player) throw new Error('Player not found');
    player.hand = hand;
  });
  return newState;
};

export const addPlayer = ({
  state,
  name,
  socket,
  id,
}: {
  state: GameState;
  name: string;
  socket: Socket;
  id: string;
}) => {
  const newState = produce(state, (draftState) => {
    draftState.lobby.push({
      id,
      name: name,
      hand: [],
      socket: socket,
      phase: 1,
      pile: [],
      points: 0,
    });
  });
  return newState;
};
export const nextPlayer = ({ state }: { state: GameState }) => {
  const newState = produce(state, (draftState) => {
    if (draftState.currentPlayerIndex === null) {
      draftState.currentPlayerIndex = 0;
    } else {
      // Go to the next player, and wrap around to the beginning if necessary
      draftState.currentPlayerIndex =
        (draftState.currentPlayerIndex + 1) % draftState.lobby.length;
    }
  });
  return newState;
};

export const updatePlayersPile = ({
  state,
  pile,
  playerIndex,
  pileIndex,
}: {
  state: GameState;
  pile: Pile;
  playerIndex: number;
  pileIndex: number;
}) => {
  const newState = produce(state, (draftState) => {
    const lobby = draftState.lobby;
    const player = lobby?.[playerIndex];
    if (!player) throw new Error('Player not found');

    if (!player.pile[pileIndex])
      throw new Error('Pile not found / invalid pile index');
    player.pile[pileIndex] = pile;
  });
  return newState;
};

export const updatePlayerIndex = ({
  state,
  playerIndex,
}: {
  state: GameState;
  playerIndex: number;
}) => {
  const newState = produce(state, (draftState) => {
    draftState.currentPlayerIndex = playerIndex;
  });
  return newState;
};

export const updatePlayersPoints = ({
  state,
  points,
  playerIndex,
}: {
  state: GameState;
  points: number;
  playerIndex: number;
}) => {
  const newState = produce(state, (draftState) => {
    const lobby = draftState.lobby;
    const player = lobby?.[playerIndex];
    if (!player) throw new Error('Player not found');
    player.points = points;
  });
  return newState;
};

export const moveToPile = (
  state: GameState,
  cardId: string,
  playerIndex: number,
  pileIndex: number
): GameState => {
  return produce(state, (draftState) => {
    const player = draftState.lobby[playerIndex];
    if (!player) throw new Error('Player not found');
    const cardIndex = player.hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) return; // card not found in hand
    const card = player.hand[cardIndex];
    if (!card) throw new Error('Card not found');
    player.hand.splice(cardIndex, 1); // remove from hand

    // Ensure the pile exists
    if (!player.pile[pileIndex]) {
      player.pile[pileIndex] = [];
    }

    player.pile[pileIndex]!.push(card); // add to the desired pile
  });
};

export const moveToHand = (
  state: GameState,
  cardId: string,
  playerIndex: number
): GameState => {
  return produce(state, (draftState) => {
    const player = draftState.lobby[playerIndex];
    if (!player) throw new Error('Player not found');
    let foundPileIndex: number | null = null;
    let foundCardIndex: number | null = null;

    for (let i = 0; i < player.pile.length; i++) {
      const pile = player.pile[i];
      if (!pile) throw new Error('Pile not found');
      const cardIndex = pile.findIndex((card) => card.id === cardId);
      if (cardIndex !== -1) {
        foundPileIndex = i;
        foundCardIndex = cardIndex;
        break;
      }
    }

    if (foundCardIndex !== null && foundPileIndex !== null) {
      const card = player.pile[foundPileIndex]!.splice(foundCardIndex, 1)[0];
      if (!card) throw new Error('Card not found');
      player.hand.push(card); // add back to hand
    }
  });
};

/*Reset functions */

export const resetAllPlayersHands = ({ state }: { state: GameState }) => {
  const newState = produce(state, (draftState) => {
    const lobby = draftState.lobby;
    lobby.forEach((player) => {
      player.hand = [];
    });
  });
  return newState;
};

export const resetAllPlayersPiles = ({ state }: { state: GameState }) => {
  const newState = produce(state, (draftState) => {
    const lobby = draftState.lobby;
    lobby.forEach((player) => {
      player.pile = [];
    });
  });
  return newState;
};

export const resetAllPlayersPoints = ({ state }: { state: GameState }) => {
  const newState = produce(state, (draftState) => {
    const lobby = draftState.lobby;
    lobby.forEach((player) => {
      player.points = 0;
    });
  });
  return newState;
};
