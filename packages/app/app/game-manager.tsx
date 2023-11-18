import React from 'react';
import { type Socket } from 'socket.io-client';
import { type Card } from './components/card';
import Game from './game';
import { useUser } from './contexts/user-context';
import { useSocket } from './contexts/socket-context';

type Pile = Card[][];

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  socket: Socket;
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  pile: Pile;
  points: number;
}

let gameState: GameState = {
  id: null,
  discardCard: null,
  deck: [],
  lobby: [],
  roomCode: null,
  currentPlayerIndex: -1,
  isJoinable: false,
};

export interface GameState {
  id: string | null;
  discardCard: Card | null;
  deck: Card[];
  lobby: Player[];
  currentPlayerIndex: number;
  roomCode: null;
  isJoinable: boolean;
}

export default function GameManager({ game }: { game: GameState }) {
  const socket = useSocket();
  const { user } = useUser();

  const usersInfo = game.lobby.filter((player) => player.id !== user.id);

  const opponentInfo = game.lobby.filter((player) => player.id === user.id);

  const currentPhase = usersInfo[0].phase;

  const opponentName = opponentInfo[0].name;
  const opponentsPhaseNumber = opponentInfo[0].phase;

  const [cards, setCards] = React.useState<Card[]>(usersInfo[0].hand);

  const currentPlayerIndex = game.currentPlayerIndex;

  // who is the player at that index?
  const isPlayersTurn =
    game.lobby.findIndex((player) => player.id === user.id) ===
    currentPlayerIndex;

  if (!socket) return null;

  return (
    <Game
      isPlayersTurn={isPlayersTurn}
      cards={cards}
      opponentName={opponentName}
      opponentsPhaseNumber={opponentsPhaseNumber}
      setCards={setCards}
      currentPhase={currentPhase}
      name={usersInfo[0].name}
      initialDiscardCard={game.discardCard!}
      socket={socket}
    />
  );
}
