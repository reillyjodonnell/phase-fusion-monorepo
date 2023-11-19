import React from 'react';
import { type Card } from '../components/card';
import { type Socket } from 'socket.io-client';

export default function useDiscard(
  socket: Socket,
  name: string,
  callback: Function,
  defaultDiscard: Card,
  setCards: Function
) {
  const [discard, setDiscard] = React.useState<Card | null>(defaultDiscard);

  React.useEffect(() => {
    socket.on('discard card', (card: Card) => {
      if (!card) {
        setDiscard(null);
        return;
      }

      if (card.color === 'yellow') {
        card.color = 'gold';
      }

      switch (card.type) {
        case 'regular':
          break;
        case 'skip':
          card.number = '🙅‍♂️';
          break;
        case 'wild':
          card.number = 'W';
          break;
      }
      setDiscard(card);
    });
    return () => {
      socket.off('discard card');
    };
  }, [socket]);

  function takeCardFromdiscard() {
    // if type is the skip you can't pick it up
    if (discard?.type === 'skip') return;
    if (!discard) return;
    callback();
    socket.emit('take discard card', name, (card: Card) => {
      setCards((prevCards: Card[]) => [...prevCards, card]);
    });
  }

  return { card: discard, onPress: takeCardFromdiscard };
}
