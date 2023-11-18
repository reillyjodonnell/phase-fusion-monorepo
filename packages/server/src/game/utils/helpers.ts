import { type Player } from '../game-state';

export function retrievePlayerByName(lobby: Player[], name: string): Player {
  if (!lobby) throw new Error('Lobby is undefined');
  if (!name) throw new Error('Name is undefined');

  const foundPlayer = lobby.find((player) => player.name === name);
  if (!foundPlayer) throw new Error('Player not found');

  return foundPlayer;
}

// Path: src/game.ts

export type Color = 'red' | 'green' | 'blue' | 'yellow';

export type CardType = 'regular' | 'skip' | 'wild';

export interface Card {
  id: string;
  color?: Color;
  number?: number;
  type: CardType;
}

export const sortCards = (cards: Card[]): Card[] => {
  const colorOrder: { [color in Color]: number } = {
    blue: 1,
    green: 2,
    red: 3,
    yellow: 4,
  };

  return cards.sort((a, b) => {
    // Handle special cards like wild and skip
    if (!a.color && !b.color) return 0;
    if (!a.color) return 1;
    if (!b.color) return -1;

    // Sort by color first
    if (a.color !== b.color) return colorOrder[a.color] - colorOrder[b.color];

    // If colors are the same, sort by number
    return (a.number || 0) - (b.number || 0);
  });
};

// deal players cards but there can only be 1 card of all potential cards

export const createDeck = () => {
  const colors = ['red', 'blue', 'yellow', 'green'];
  const numbers = Array.from({ length: 12 }, (_, i) => i + 1);

  // Regular cards - two sets of each number for each color
  const regularCards = colors.flatMap((color) =>
    numbers.flatMap((number) => [
      {
        id: `${color}_${number}_1`,
        color,
        number,
        type: 'regular',
      },
      {
        id: `${color}_${number}_2`,
        color,
        number,
        type: 'regular',
      },
    ])
  );

  // Skip cards
  const skipCards = Array.from({ length: 4 }, (_, i) => ({
    id: `skip_${i + 1}`,
    type: 'skip',
  }));

  // Wild cards
  const wildCards = Array.from({ length: 8 }, (_, i) => ({
    id: `wild_${i + 1}`,
    type: 'wild',
  }));

  return [...regularCards, ...skipCards, ...wildCards];
};

// this function gets the phases the user has to complete based on which number they are on
function retrievePhasesPromptFromNumber(phase: number) {
  switch (phase) {
    case 1:
      return ['Set of 3', 'Set of 3'];
    case 2:
      return ['Set of 3', 'Run of 4'];
    case 3:
      return ['Set of 4', 'Run of 4'];
    case 4:
      return ['Run of 7'];
    case 5:
      return ['Run of 8'];
    case 6:
      return ['Run of 9'];
    case 7:
      return ['Set of 4', 'Set of 4'];
    case 8:
      return ['7 cards of 1 color'];
    case 9:
      return ['1 set of 5', '1 set of 2'];
    case 10:
      return ['1 set of 5', '1 set of 3'];
    default:
      return [];
  }
}
export const shuffleDeck = (deck: Card[]): Card[] => {
  // Create a copy of the deck so that we don't mutate the original
  const shuffledDeck = [...deck];

  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    //@ts-ignore
    [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
  }

  return shuffledDeck;
};
export const dealCards = (deck: Card[], numCards: number): [Card[], Card[]] => {
  // Cards to be dealt to the player
  const dealtCards = deck.slice(0, numCards);
  // Remaining cards in the deck after dealing
  const remainingDeck = deck.slice(numCards);
  return [dealtCards, remainingDeck];
};
