import {
  retrievePlayerByName,
  createDeck,
  Card,
  sortCards,
  shuffleDeck,
  dealCards,
} from '../game/utils/helpers';
import {
  GameState,
  addPlayer,
  getGameState,
  nextPlayer,
  setGameState,
  updateDeck,
  updatePlayerIndex,
  updatePlayersHand,
  updateDiscardCard,
  resetAllPlayersHands,
  resetAllPlayersPiles,
  updatePlayersPoints,
  Player,
  getDefaultGameState,
} from '../game/game-state';
import { produce } from 'immer';
import { getPointsFromHand } from '../game/points/points';
import { type Server, type Socket } from 'socket.io';
import { type DefaultEventsMap } from 'socket.io/dist/typed-events';
import { generateId } from '../helpers/helper';
import { RedisClientType } from '..';

export type Lobby = {
  id: string;
  createdAt: number;
  roomCode: string;
  maxPlayers: number;
  players: Player[];
};

export const setupGameListeners = (
  socket: Socket,
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  client: RedisClientType
) => {
  socket.on('error', (error) => {
    //console.log('Socket error:', error);
  });

  socket.on('new game', (lobby, callback) => {
    // get the default state of a new game
    const defaultGameState = getDefaultGameState();

    const gameId = generateId();

    // set the game id
    const updatedGameState: GameState = {
      ...defaultGameState,
      roomCode: lobby.roomCode,
      id: gameId,
      lobby: lobby.players.map((player: Player) => {
        return {
          ...player,
          hand: [],
          pile: [],
          phase: 1,
          points: 0,
        };
      }),
    };

    // set the state
    setGameState(client, updatedGameState);

    function redirectAllUsersToGame(state: GameState) {
      //console.log('REDIRECTALLUSERSTOGAME');
      callback(state);
      io.to(lobby.roomCode).emit('redirect user to game', state);
    }

    startGame(io, client, redirectAllUsersToGame, updatedGameState);
  });

  socket.on('disconnect', () => {
    io.emit('stop game');
  });
  socket.on('chat message', (msg) => {});
  // socket.on('name', (name) => {
  //   handleName({ name, socket, io });
  // });

  socket.on('take discard card', (playerName, callback) => {
    takeDiscardCard({ name: playerName, socket, io, callback });
  });

  socket.on('draw from deck', (name) => {
    drawFromDeck(name, socket);
  });

  // Handle the discard from the player after taking the center card or drawing from the deck
  socket.on('discard', ({ name, card }) => {
    discardCard({ name, card, socket, io });
  });

  socket.on('phase complete', (name, phaseNumber, { set1, set2 }) => {
    const latest = completePhase({ name, phaseNumber, set1, set2 });
    setGameState(latest);
  });

  socket.on('play on pile', (name, targetPlayer, pileIndex, cards) => {
    playOnPile({ cards, name, pileIndex, targetPlayer });
  });
};

// function handleName({
//   name,
//   socket,
//   io,
// }: {
//   name: string;
//   socket: Socket;
//   io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
// }) {
//   const gameState = getGameState();
//   const id = generateId();
//   const updatedState = addPlayer({ state: gameState, name, socket, id });

//   // write the updatedState to the global state
//   setGameState(updatedState);

//   // emit a message to the player their id
//   socket.emit('id', id);

//   if (updatedState.lobby.length === 1) {
//     //console.log('waiting for player');
//     socket.emit('waiting for player');
//   }

//   if (updatedState.lobby.length === 2) {
//     const player1 = updatedState.lobby[0];
//     const player2 = updatedState.lobby[0];

//     if (!player1 || !player2) {
//       //console.log('Players not found');
//       throw new Error('Players not found');
//     }

//     startGame(io, client);
//   }
// }

async function startGame(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  client: any,
  callback: Function,
  state: GameState
) {
  //console.log('starting game');
  // Initialize and fetch the new game state
  const initialGameState = state;

  // start at blank slate for players for cards and discard piles
  const stateAfterResettingPlayersHands = resetAllPlayersHands({
    state: initialGameState,
  });
  const stateAfterResettingPlayersPiles = resetAllPlayersPiles({
    state: stateAfterResettingPlayersHands,
  });

  // get the deck and hands
  const deckAndHands = setupDeckAndHands(stateAfterResettingPlayersPiles);
  const updatedGameState = setupPotCard(deckAndHands);

  // choose one of the players to go first
  const randomizedPlayerIndex = Math.floor(
    Math.random() * updatedGameState.lobby.length
  );
  const latest = updatePlayerIndex({
    state: updatedGameState,
    playerIndex: randomizedPlayerIndex,
  });

  emitGameEvents({ io, state: latest, client });
  // Update the global game state
  setGameState(client, latest);
  callback(latest);
}

function emitGameEvents({
  io,
  state,
  client,
}: {
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  state: GameState;
  client: RedisClientType;
}) {
  // get the number of players
  const numberOfPlayers = state.lobby.length;
  io.emit('pile', [], []);

  const roomCode = state.roomCode;
  if (!roomCode) return;

  // for each user get each user profile
  state.lobby.forEach(async (player, index) => {
    // get the user profile
    const data = await client.get(`user:${player.id}`);
    if (!data) {
      //console.log('User not found');
      return;
    }
    const jsonUser = JSON.parse(data);
    const socketId = jsonUser.socketId;

    const targetSocket = io.sockets.sockets.get(socketId);

    const otherPlayersName = state.lobby[(index + 1) % numberOfPlayers]?.name;
    const otherPlayersPhase = state.lobby[(index + 1) % numberOfPlayers]?.phase;

    targetSocket?.emit(
      'game started',
      player.hand,
      player.phase,
      otherPlayersName,
      otherPlayersPhase
    );
  });

  //console.log('Emitting discard card');
  io.to(roomCode).emit('discard card', state.discardCard);

  // TODO : Update this down below

  // if (state.currentPlayerIndex !== null) {
  //   // write to the person who's turn it is
  //   const currentPlayerIndex = state.currentPlayerIndex;
  //   state.lobby[currentPlayerIndex]?.socket.emit('turn', true);
  //   // write to everyone else it's not their turn
  //   state.lobby.forEach((player, index) => {
  //     if (index !== currentPlayerIndex) {
  //       player.socket.emit('turn', false);
  //     }
  //   });
  // }
}

type DealingResult = [
  Card[], // Remaining deck
  Card[][] // Hands of all players
];

export const dealCardsToAllPlayers = (
  deck: Card[],
  numCards: number,
  numPlayers: number
): DealingResult => {
  let remainingDeck = deck;
  const playersHands: Card[][] = [];

  for (let i = 0; i < numPlayers; i++) {
    const [dealt, remaining] = dealCards(remainingDeck, numCards);
    // sort the cards
    const sorted = sortCards(dealt);
    playersHands.push(sorted);
    remainingDeck = remaining;
  }

  return [remainingDeck, playersHands];
};

function setupDeckAndHands(state: GameState): GameState {
  const shuffledDeck = shuffleDeck(createDeck() as Card[]);
  const numPlayers = state.lobby.length;
  const [remainingDeck, playersHands] = dealCardsToAllPlayers(
    shuffledDeck,
    10,
    numPlayers
  );

  const newState = playersHands.reduce((currentState, hand, index) => {
    return updatePlayersHand({
      hand: hand,
      playerIndex: index,
      state: currentState,
    });
  }, updateDeck({ state, deck: remainingDeck }));

  return newState;
}

function setupPotCard(state: GameState): GameState {
  // Extract the dealt card and the remaining deck
  const [dealtCards, remainingDeck] = dealCards(state.deck, 1);
  const discardCard = dealtCards[0];

  const stateWithUpdatedDeck = updateDeck({ state, deck: remainingDeck });

  return updateDiscardCard({ state: stateWithUpdatedDeck, card: discardCard! });
}

function drawFromDeck(name: string, socket: Socket) {
  const gameState = getGameState();
  if (
    gameState.currentPlayerIndex === null ||
    gameState.lobby[gameState.currentPlayerIndex]?.name !== name
  ) {
    socket.emit('error', "It's not your turn!");
    return;
  }
  if (gameState.deck.length) {
    const [dealtCards, remainingDeck] = dealCards(gameState.deck, 1);
    const drawnCard = dealtCards[0];

    const updatedState = updateDeck({ state: gameState, deck: remainingDeck });

    if (!drawnCard) {
      throw new Error('Drawn card is undefined / null');
    }
    // Find the player's hand
    const player = retrievePlayerByName(updatedState.lobby, name);
    if (!player) {
      //console.log('Player not found');
      socket.emit('error', 'Player not found');
      return;
    }

    // Add the drawn card to the player's hand
    // make sure the card is in the right order
    const newHand = sortCards([...player.hand, drawnCard]);
    const newState = updatePlayersHand({
      state: updatedState,
      hand: newHand,
      playerIndex: updatedState.currentPlayerIndex!,
    });

    // Inform the player about their new hand
    socket.emit(
      'cards',
      updatedState.lobby[newState.currentPlayerIndex!]!.hand,
      updatedState.lobby[(newState.currentPlayerIndex! + 1) % 2]?.hand.length,
      drawnCard
    );

    setGameState(newState);

    //console.log(`${name} drew a card from the deck`);
  } else {
    socket.emit('error', 'Deck is empty!');
  }
}
function switchTurn() {
  const gameState = getGameState();

  if (gameState.currentPlayerIndex !== null) {
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % 2;

    gameState.lobby[gameState.currentPlayerIndex]?.socket.emit('turn', false);
    gameState.lobby[nextPlayerIndex]?.socket.emit('turn', true);

    const latest = nextPlayer({ state: gameState });
    setGameState(latest);
  }
}

function takeDiscardCard({
  name,
  socket,
  io,
  callback,
}: {
  name: string;
  socket: Socket;
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  callback: Function;
}) {
  //console.log(`${name} took the discard card`);
  const gameState = getGameState();
  if (!gameState.roomCode) {
    throw new Error('No room code found');
  }

  const player = retrievePlayerByName(gameState.lobby, name);

  if (!player) {
    //console.log('Player not found');
    throw new Error('Player not found');
  }

  if (!gameState.discardCard) {
    socket.emit('error', 'No card in the pot to take!');
    return;
  }

  // game rule: user can't pick up the skip card
  if (gameState.discardCard.type === 'skip') {
    //console.log("ERROR: Can't pick up a skip card");
    socket.emit('error', 'You cannot pick up a skip card!');
    return;
  }

  const playerIndex = gameState.lobby.findIndex((player) => {
    return player.name === name;
  });

  const newGameState = updatePlayersHand({
    state: gameState,
    hand: [...player.hand, gameState.discardCard],
    playerIndex,
  });

  callback(gameState.discardCard);

  // reset discard card
  const updatedGameState = updateDiscardCard({
    state: newGameState,
    card: null,
  });

  setGameState(updatedGameState);

  const activePlayer =
    updatedGameState.lobby[updatedGameState.currentPlayerIndex];

  if (!activePlayer) {
    //console.log('Active player not found');
    return;
  }

  // Pot card is now null for all players
  //console.log('Emitting Discard card');
  io.to(gameState.roomCode).emit('discard card', updatedGameState.discardCard);
}

function playOnPile({
  name,
  targetPlayer,
  pileIndex,
  cards,
}: {
  name: string;
  targetPlayer: string;
  pileIndex: number;
  cards: Card[];
}) {
  const gameState = getGameState();

  //console.log(`${name} played on an existing pile`);

  const player = retrievePlayerByName(gameState.lobby, name);
  if (!player) {
    //console.log('Player not found');
    return;
  }

  // The user can play on their own set or the opponents set
  const isPlayersSet = name === targetPlayer;

  const newGameState = produce(gameState, (draftState) => {
    if (isPlayersSet) {
      //console.log(`${name} played on their own set`);
      const pile = draftState.lobby.find((p) => p.name === name)?.pile[
        pileIndex
      ];
      if (!pile) {
        //console.log('Pile not found');
        return;
      }
      pile.push(...cards);
    } else {
      const opponent = draftState.lobby.find((p) => p.name === targetPlayer);
      if (!opponent) {
        //console.log('Opponent not found');
        return;
      }
      const pile = opponent.pile[pileIndex];
      if (!pile) {
        //console.log('Pile not found');
        return;
      }
      pile.push(...cards);
    }

    // Remove the cards from the player's hand
    const currentPlayer = draftState.lobby.find((p) => p.name === name);
    if (currentPlayer) {
      currentPlayer.hand = currentPlayer.hand.filter((card: Card) => {
        return !cards.some((cardToRemove: Card) => cardToRemove.id === card.id);
      });
    }
  });

  setGameState(newGameState);

  // Get the other player's hands
  const otherPlayer = newGameState.lobby.find((player) => {
    return player.name !== name;
  });

  const activePlayerHand =
    newGameState.lobby[newGameState.currentPlayerIndex!]?.hand;
  const activePlayerPile =
    newGameState.lobby[newGameState.currentPlayerIndex!]?.pile;

  // Emit the updated piles to all players
  player.socket.emit('pile', activePlayerPile, otherPlayer?.pile);
  player.socket.emit('cards', activePlayerHand, otherPlayer?.hand.length);

  // for all the other players
  newGameState.lobby.forEach((player) => {
    if (player.name !== name) {
      player.socket.emit('pile', player.pile, activePlayerPile);

      // Emit the updated hands to all players
      player.socket.emit('cards', player.hand, activePlayerHand?.length);
    }
  });
}

function completePhase({
  name,
  phaseNumber,
  set1,
  set2,
}: {
  name: string;
  phaseNumber: number;
  set1: Card[];
  set2: Card[];
}) {
  return produce(getGameState(), (draftGameState) => {
    //console.log(`${name} completed phase ${phaseNumber}`);

    // Find the player and their index
    const playerIndex = draftGameState.lobby.findIndex(
      (player) => player.name === name
    );
    if (playerIndex === -1) {
      //console.log('Player index not found');
      return;
    }
    const player = draftGameState.lobby[playerIndex];

    if (!player) {
      throw new Error('Player not found');
      //console.log('Player not found');
      return;
    }

    if (phaseNumber < 10 && phaseNumber >= 1) {
      //@ts-ignore
      player.phase = phaseNumber + 1;
    } else {
      //@ts-ignore

      player.phase = phaseNumber;
    }
    // Push each pile to the player's array of piles
    player.pile.push(set1, set2);

    // Remove the cards from the player's hand
    const cardsToBeRemoved = [set1, set2].flat();
    player.hand = player.hand.filter(
      (card) =>
        !cardsToBeRemoved.some((cardToRemove) => cardToRemove.id === card.id)
    );

    // Find the other player
    const otherPlayer = draftGameState.lobby.find(
      (player) => player.name !== name
    );

    // Emit updates related to piles
    player.socket.emit('pile', player.pile, otherPlayer?.pile);
    otherPlayer?.socket.emit('pile', otherPlayer.pile, player.pile);

    // Emit updates related to hands
    player.socket.emit('cards', player.hand, otherPlayer?.hand.length);
    otherPlayer?.socket.emit('cards', otherPlayer.hand, player.hand.length);
  });
}

function startNextRound(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  const gameState = getGameState();

  // check if the person completed phase 10
  const player1 = gameState.lobby[0];
  const player2 = gameState.lobby[1];

  if (!player1 || !player2) {
    //console.log('Players not found');
    return;
  }
  if (player1.phase === 10) {
    //console.log(`${player1.name} won the game!`);
    io.emit('game over', player1.name);
    return;
  }
  if (player2.phase === 10) {
    //console.log(`${player2.name} won the game!`);
    io.emit('game over', player2.name);
    return;
  }

  // loop through everyone and tally up points and update state
  gameState.lobby.forEach((player, index) => {
    // get the latest state
    const latest = getGameState();
    const cards = latest.lobby[index]!.hand;
    const points = getPointsFromHand(cards);
    const brandNewState = updatePlayersPoints({
      state: latest,
      playerIndex: index,
      points,
    });

    setGameState(brandNewState);
  });

  // assign points to the player who didn't complete phase 10

  startGame(io);
}
function discardCard({
  name,
  card,
  socket,
  io,
}: {
  name: string;
  card: Card;
  socket: Socket;
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
}) {
  const gameState = getGameState();

  if (
    gameState.currentPlayerIndex === null ||
    gameState.lobby[gameState.currentPlayerIndex]?.name !== name
  ) {
    socket.emit('error', "It's not your turn!");
    return;
  }

  //console.log(`${name} discarded ${card.id}`);

  const player = retrievePlayerByName(gameState.lobby, name);

  if (!player?.hand) {
    //console.log('Player not found');
    return;
  }

  // Check if the card exists in the player's hand
  const cardIndex = player.hand.findIndex(
    (cardFromHand: Card) => card.id === cardFromHand.id
  );

  if (cardIndex === -1) {
    socket.emit('error', 'Invalid card to discard!');
    return;
  }

  const updatedHand = [
    ...player.hand.slice(0, cardIndex),
    ...player.hand.slice(cardIndex + 1),
  ];
  const updatedLobby = gameState.lobby.map((p) =>
    p.name === name ? { ...p, hand: updatedHand } : p
  );

  const updatedGameState = {
    ...gameState,
    lobby: updatedLobby,
    discardCard: card,
  };

  setGameState(updatedGameState); // This is how we "apply" our changes

  io.emit('discard card', updatedGameState.discardCard);
  socket.emit(
    'cards',
    updatedHand,
    updatedGameState.lobby[(gameState.currentPlayerIndex! + 1) % 2]?.hand.length
  );
  updatedGameState.lobby[(gameState.currentPlayerIndex! + 1) % 2]?.socket.emit(
    'cards',
    updatedGameState.lobby[(gameState.currentPlayerIndex! + 1) % 2]?.hand,
    updatedHand.length
  );

  if (card.type === 'skip') {
    //console.log(`${name} played a skip card!`);
    if (gameState.currentPlayerIndex !== null) {
      updatedGameState.lobby[gameState.currentPlayerIndex]?.socket.emit(
        'turn',
        true
      );
      return;
    }
  } else {
    switchTurn();
  }

  if (updatedHand.length === 0) {
    //console.log(`${name} has discarded their final card!`);
    io.emit('end of round', name);
    startNextRound(io);
  }
}
