import { type Card } from '../../components/card';
import { Color } from '../../lib/utils';

export function retrievePhasesPromptFromNumber(phase: number) {
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

const useCards = (hand: Card[], usedCards: Card[]): Card[] => {
  return hand.filter((card) => !usedCards.includes(card));
};

export const hasSet = (hand: Card[], num: number): [boolean, Card[]] => {
  const cardCount: { [key: number]: string[] } = {};
  let wilds: Card[] = [];

  hand.forEach((card) => {
    if (card.type === 'regular') {
      if (!cardCount[card.number!]) {
        cardCount[card.number!] = [];
      }
      cardCount[card.number!].push(card.id);
    } else if (card.type === 'wild') {
      wilds.push(card);
    }
  });

  for (const number in cardCount) {
    if (cardCount[number].length + wilds.length >= num) {
      const regularUsedIDs = cardCount[number].slice(0, num);
      const regularUsed = hand.filter((card) =>
        regularUsedIDs.includes(card.id)
      );

      const wildNeeded = num - cardCount[number].length;
      const wildUsed = wilds.slice(0, wildNeeded);

      return [true, [...regularUsed, ...wildUsed]];
    }
  }

  return [false, []];
};

export const hasRun = (hand: Card[], num: number): [boolean, Card[]] => {
  const sortedHand = [...hand].sort(
    (a, b) => (a.number || 0) - (b.number || 0)
  );

  let runCount = 1;
  let usedCards: Card[] = [];
  let wildcards: Card[] = hand.filter((card) => card.type === 'wild');
  let wildcardsUsed: Card[] = [];

  for (let i = 1; i < sortedHand.length; i++) {
    if (sortedHand[i].type === 'wild') {
      continue; // skip wilds during this iteration
    }

    if (sortedHand[i].number === sortedHand[i - 1].number! + 1) {
      runCount++;
      if (!usedCards.includes(sortedHand[i - 1])) {
        usedCards.push(sortedHand[i - 1]);
      }
      usedCards.push(sortedHand[i]);
    } else if (
      wildcards.length > 0 &&
      sortedHand[i].number! - sortedHand[i - 1].number! - 1 <= wildcards.length
    ) {
      // use wildcards to fill the gap
      let gapSize = sortedHand[i].number! - sortedHand[i - 1].number! - 1;
      runCount += gapSize + 1;
      if (!usedCards.includes(sortedHand[i - 1])) {
        usedCards.push(sortedHand[i - 1]);
      }
      usedCards.push(sortedHand[i]);
      for (let j = 0; j < gapSize; j++) {
        let usedWildcard = wildcards.pop();
        if (usedWildcard) {
          wildcardsUsed.push(usedWildcard);
        }
      }
    } else {
      runCount = 1;
      usedCards = [sortedHand[i]];
      wildcardsUsed = [];
    }

    if (runCount >= num) {
      return [true, [...usedCards, ...wildcardsUsed]];
    }
  }

  // if the remaining wildcards can complete the run
  if (runCount + wildcards.length >= num) {
    return [
      true,
      [...usedCards, ...wildcardsUsed, ...wildcards.slice(0, num - runCount)],
    ];
  }

  return [false, []];
};

export const hasColor = (hand: Card[], num: number): [boolean, Card[]] => {
  const wildCards = hand.filter((card) => card.type === 'wild');

  // Get distinct colors in the hand
  const colors = [...new Set(hand.map((card) => card.color))];

  for (let color of colors) {
    const colorCards = hand.filter((card) => card.color === color);

    if (colorCards.length + wildCards.length >= num) {
      // If the number of colored cards alone is enough
      if (colorCards.length >= num) {
        return [true, colorCards.slice(0, num)];
      } else {
        // Mix of colored cards and wild cards
        return [
          true,
          [...colorCards, ...wildCards.slice(0, num - colorCards.length)],
        ];
      }
    }
  }

  return [false, []];
};

export const evaluatePhaseCompletion = (
  hand: Card[],
  phase: number
): [boolean, boolean, Card[], Card[]] => {
  switch (phase) {
    case 1: {
      const [set1Complete, set1Used] = hasSet(hand, 3);
      hand = useCards(hand, set1Used);
      const [set2Complete, set2Used] = hasSet(hand, 3);
      return [set1Complete, set2Complete, set1Used, set2Used];
    }
    case 2: {
      const [setComplete, setUsed] = hasSet(hand, 3);
      hand = useCards(hand, setUsed);
      const [runComplete, runUsed] = hasRun(hand, 4);

      return [setComplete, runComplete, setUsed, runUsed];
    }
    case 3: {
      const [setComplete, setUsed] = hasSet(hand, 4);
      hand = useCards(hand, setUsed);
      const [runComplete, runUsed] = hasRun(hand, 4);
      return [setComplete, runComplete, setUsed, runUsed];
    }

    case 4: {
      const [runComplete] = hasRun(hand, 7);
      return [runComplete];
    }

    case 5: {
      const [runComplete] = hasRun(hand, 8);
      return [runComplete];
    }
    case 6: {
      const [runComplete] = hasRun(hand, 9);
      return [runComplete];
    }
    case 7: {
      const [set1Complete, set1Used] = hasSet(hand, 4);
      hand = useCards(hand, set1Used);
      const [set2Complete] = hasSet(hand, 4);
      return [set1Complete, set2Complete];
    }
    case 8: {
      const [colorComplete] = hasColor(hand, 7);
      return [colorComplete];
    }

    case 9: {
      const [set1Complete, set1Used] = hasSet(hand, 5);
      hand = useCards(hand, set1Used);
      const [set2Complete] = hasSet(hand, 2);
      return [set1Complete, set2Complete];
    }
    case 10: {
      const [set1Complete, set1Used] = hasSet(hand, 5);
      hand = useCards(hand, set1Used);
      const [set2Complete] = hasSet(hand, 3);
      return [set1Complete, set2Complete];
    }
    default:
      return [false];
  }
};

export const canAddToPile = (pile: Card[], selectedCards: Card[]): boolean => {
  if (!pile || !selectedCards) return false;
  if (pile.length === 0) return false;
  if (selectedCards.length === 0) return false;
  // Helper function to count wilds in an array of cards
  const countWilds = (cards: Card[]) =>
    cards.filter((card) => card.type === 'wild').length;

  // Check if pile is a set
  const isSet = (cards: Card[]) => {
    const nonWilds = cards.filter((card) => card.type !== 'wild');
    const numbers = nonWilds.map((card) => card.number);
    return new Set(numbers).size === 1;
  };

  // Check if pile is a run, accounting for wilds
  const isRun = (cards: Card[]) => {
    const sortedNumbers = cards
      .filter((card) => card.type !== 'wild')
      .map((card) => card.number)
      .sort((a, b) => a - b);

    let wildsNeeded = 0;
    for (let i = 0; i < sortedNumbers.length - 1; i++) {
      //@ts-ignore
      wildsNeeded += sortedNumbers[i + 1] - sortedNumbers[i] - 1;
    }

    return wildsNeeded <= countWilds(cards);
  };

  // Check if pile is a color set
  const isColorSet = (cards: Card[]) => {
    const nonWilds = cards.filter((card) => card.type !== 'wild');
    const colors = nonWilds.map((card) => card.color);
    return new Set(colors).size === 1;
  };

  if (isSet(pile)) {
    return isSet([...pile, ...selectedCards]);
  } else if (isRun(pile)) {
    const combined = [...pile, ...selectedCards];
    return isRun(combined);
  } else if (isColorSet(pile)) {
    return isColorSet([...pile, ...selectedCards]);
  }

  return false;
};
