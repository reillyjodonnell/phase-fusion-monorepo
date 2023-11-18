import { Card } from '../../components/card';
import {
  evaluatePhaseCompletion,
  hasColor,
  hasRun,
  hasSet,
  retrievePhasesPromptFromNumber,
} from './phases-helper';
import { phase2CompleteScenario } from './test-data';

describe('We want to retrieve the prompt for each container from the number', () => {
  it('should work for each scenario', () => {
    expect(retrievePhasesPromptFromNumber(1)).toStrictEqual([
      'Set of 3',
      'Set of 3',
    ]);
  });
});

describe('testing sets for phases', () => {
  describe('testing sets for phase 1', () => {
    it('should pass when passed 3 valid arguments', () => {
      const cards: Card[] = [
        { color: 'blue', id: 'blue_12_1', number: 12, type: 'regular' },
        { color: 'green', id: 'green_12_2', number: 12, type: 'regular' },
        { color: undefined, id: 'wild_5', number: undefined, type: 'wild' },
      ];
      const [passes, usedCards] = hasSet(cards, 3);

      expect(passes).toBe(true);

      expect(usedCards).toStrictEqual(cards);
    });
    it('should fail when passed 3 invalid arguments', () => {
      const cards: Card[] = [
        { color: 'blue', id: 'blue_12_1', number: 12, type: 'regular' },
        { color: 'green', id: 'green_13_2', number: 13, type: 'regular' },
        { color: undefined, id: 'wild_5', number: undefined, type: 'wild' },
      ];
      const [passes, usedCards] = hasSet(cards, 3);

      expect(passes).toBe(false);

      expect(usedCards).toStrictEqual([]);
    });
  });
  describe('testing sets for phase 2', () => {
    it('should pass when passed 4 valid arguments', () => {
      const cards: Card[] = [
        { color: 'blue', id: 'blue_12_1', number: 12, type: 'regular' },
        { color: 'green', id: 'green_12_2', number: 12, type: 'regular' },
        { color: 'yellow', id: 'yellow_12_1', number: 12, type: 'regular' },
        { color: 'red', id: 'red_12_1', number: 12, type: 'regular' },
      ];
      const [passes, usedCards] = hasSet(cards, 4);

      expect(passes).toBe(true);

      expect(usedCards).toStrictEqual(cards);
    });
    it('should fail when passed 4 invalid arguments', () => {
      const cards: Card[] = [
        { color: 'blue', id: 'blue_12_1', number: 12, type: 'regular' },
        { color: 'green', id: 'green_13_2', number: 13, type: 'regular' },
        { color: undefined, id: 'wild_5', number: undefined, type: 'wild' },
        { color: 'red', id: 'red_12_1', number: 12, type: 'regular' },
      ];
      const [passes, usedCards] = hasSet(cards, 4);

      expect(passes).toBe(false);

      expect(usedCards).toStrictEqual([]);
    });
  });
});

describe('testing runs for phases', () => {
  it('should pass when passed 3 valid arguments', () => {
    const cards: Card[] = [
      { color: 'blue', id: 'blue_12_1', number: 12, type: 'regular' },
      { color: 'green', id: 'green_6_2', number: 6, type: 'regular' },
      { color: undefined, id: 'wild_5', number: undefined, type: 'wild' },
      { color: 'red', id: 'red_11_1', number: 11, type: 'regular' },
    ];
    const [passes, usedCards] = hasRun(cards, 3);

    expect(passes).toBe(true);

    expect(usedCards.length).toEqual(
      cards.filter((card) => card.number !== 6).length
    );
  });
  it('should pass when passed 9 valid arguments', () => {
    const cards: Card[] = [
      { color: 'blue', id: 'blue_12_1', number: 12, type: 'regular' },
      { color: 'green', id: 'green_6_2', number: 6, type: 'regular' },
      { color: undefined, id: 'wild_5', number: undefined, type: 'wild' },
      { color: 'red', id: 'red_2_1', number: 2, type: 'regular' },
      { color: 'red', id: 'red_4_1', number: 4, type: 'regular' },
      { color: 'red', id: 'red_5_1', number: 5, type: 'regular' },
      { color: 'red', id: 'red_8_1', number: 8, type: 'regular' },
      { color: 'red', id: 'red_7_1', number: 7, type: 'regular' },
    ];
    const [passes, usedCards] = hasRun(cards, 7);

    expect(passes).toBe(true);

    expect(usedCards.length).toEqual(
      cards.filter((card) => card.number !== 12).length
    );
  });
  it('should pass when handed a run of 4', () => {
    const [passes] = hasRun(phase2CompleteScenario as Card[], 4);
    expect(passes).toBe(true);
  });
});

describe('testing cards of same color for phases', () => {
  const cards: Card[] = [
    { color: 'blue', id: 'blue_12_1', number: 12, type: 'regular' },
    { color: 'blue', id: 'blue_6_2', number: 6, type: 'regular' },
    { color: undefined, id: 'wild_2', number: undefined, type: 'wild' },
    { color: 'blue', id: 'blue_2_1', number: 2, type: 'regular' },
    { color: 'blue', id: 'blue_4_1', number: 4, type: 'regular' },
    { color: 'blue', id: 'blue_5_1', number: 5, type: 'regular' },
    { color: 'blue', id: 'blue_8_1', number: 8, type: 'regular' },
  ];

  const [passesWith7] = hasColor(cards, 7);
  expect(passesWith7).toBe(true);
});

describe('evaluate phase 2 completion', () => {
  it('should pass', () => {
    const [setComplete, runComplete, set1Used, set2Used] =
      evaluatePhaseCompletion(phase2CompleteScenario as Card[], 2);
    expect(setComplete).toBe(true);
    expect(runComplete).toBe(true);
  });
});
