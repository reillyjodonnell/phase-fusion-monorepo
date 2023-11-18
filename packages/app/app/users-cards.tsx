import React from 'react';
import { LayoutAnimation, View } from 'react-native';
import { Card } from './components/card';
import { type Card as CardType } from './components/card';
import { PhaseLayout } from './phases/phase-container';
import Draggable from './components/draggable';
import { useSharedValue } from 'react-native-reanimated';
import { CARD_WIDTH, OVERLAP } from './lib/constants';

export function UsersCards({
  cards,
  socket,
  name,
  setCards,
  drawnCard,
  setDrawnCard,
  phaseLayouts,
  setHighlightedPhase,
  setSelectedCards,
  hasDiscarded,
  setHasDiscarded,
}: UsersCardsProps & {
  phaseLayouts: PhaseLayout[];
  hasDiscarded: boolean;
  setHasDiscarded: Function;
  setHighlightedPhase: (index: number | null) => void;
  setSelectedCards: React.Dispatch<React.SetStateAction<Card[]>>;
}) {
  const positions = useSharedValue(listToObject(cards));

  React.useEffect(() => {
    const newPositions = listToObject(cards);
    positions.value = newPositions;
  }, [cards]);

  function discardCard(card: CardType) {
    setHasDiscarded(true);
    socket.emit('discard', { name, card });
    if (card.id === drawnCard?.id && setDrawnCard) {
      setDrawnCard(null);
    } else {
      setCards((prevCards: CardType[]) =>
        prevCards.filter((c) => c.id !== card.id)
      );
    }
  }

  function selectCards(card: Card) {
    setSelectedCards((prev) => [...prev, card]);
  }

  function deselectCards(card: Card) {
    setSelectedCards((prev) => prev.filter((c) => c.id !== card.id));
  }

  const cardOffset = CARD_WIDTH - OVERLAP;

  return (
    <View
      style={{ marginLeft: cardOffset }}
      className="flex flex-row justify-center items-center my-2 relative h-28 w-full "
    >
      {cards.map((card, index) => {
        return (
          <Draggable
            positions={positions}
            totalCards={cards.length}
            cardWidth={CARD_WIDTH}
            key={card.id}
            id={card.id}
          >
            <Card
              id={card.id}
              index={index} // <-- Add index prop to the Card component
              onRaise={selectCards}
              onLower={deselectCards}
              color={card.color}
              onDoublePress={!hasDiscarded ? () => discardCard(card) : null}
              number={card.number}
              type={card.type}
              key={card.id}
              phaseLayouts={phaseLayouts}
              highlightPhase={(index) => setHighlightedPhase(index)}
            />
          </Draggable>
        );
      })}
      {drawnCard ? (
        //@ts-ignore
        <Card
          key={drawnCard.id}
          {...drawnCard}
          onDoublePress={() => discardCard(drawnCard)}
          isRaised={true}
          onRaise={selectCards}
          onLower={deselectCards}
        />
      ) : null}
    </View>
  );
}
interface UsersCardsProps {
  cards: CardType[];
  socket: any; // Assuming SocketIO
  name: string;
  setCards: Function;
  drawnCard?: CardType | null;
  setDrawnCard?: (card: CardType | null) => void;
}

// take a generic array

function listToObject<T>(list: T[]) {
  const values = Object.values(list);
  const object = {};

  for (let i = 0; i < values.length; i++) {
    // @ts-ignore
    object[values[i].id] = i;
  }

  return object;
}
// function reorderCards(cards: any, fromIndex: any, toIndex: any) {
//   const result = Array.from(cards);
//   const [moved] = result.splice(fromIndex, 1);
//   result.splice(toIndex, 0, moved);
//   return result;
// }

//  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);

//  // Assuming phaseLayouts is an array of type PhaseLayout[]

//  function isInsideAnyPhase(dropPosition: {
//    x: number;
//    y: number;
//  }): number | null {
//    for (const [index, phaseLayout] of Object.entries(phaseLayouts)) {
//      const isInHorizontalBounds =
//        dropPosition.x >= phaseLayout.x &&
//        dropPosition.x <= phaseLayout.x + phaseLayout.width;

//      const isInVerticalBounds =
//        dropPosition.y >= phaseLayout.y &&
//        dropPosition.y <= phaseLayout.y + phaseLayout.height;

//      if (isInHorizontalBounds && isInVerticalBounds) {
//        return Number(index); // returning the index of the phase where the card was dropped
//      }
//    }
//    return null;
//  }
