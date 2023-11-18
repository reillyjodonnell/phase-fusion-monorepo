import { Card } from '../utils/helpers';

export function getPointsFromHand(hand: Card[]) {
  return hand.reduce((acc, card) => {
    if (card.type === 'wild') {
      return acc + 25;
    }
    if (card.type === 'skip') {
      return acc + 15;
    }
    //@ts-ignore bc we know it's not a wild or skip
    if (card && card?.number >= 10) {
      return acc + 10;
    }

    return acc + 5;
  }, 0);
}
