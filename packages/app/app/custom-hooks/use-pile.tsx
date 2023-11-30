import React from 'react';
import { type Socket } from 'socket.io-client';
import { type Card } from '../components/card';
import { SocketType } from '../contexts/socket-context';

export default function usePile(socket: SocketType) {
  const [pile, setPile] = React.useState<[Card[], Card[]]>([[], []]);
  const [opponentPile, setOpponentPile] = React.useState<[Card[], Card[]]>([
    [],
    [],
  ]);

  React.useEffect(() => {
    socket.on('pile', (playersPile, opponentsPile) => {
      if (playersPile) setPile(playersPile);
      if (opponentsPile) setOpponentPile(opponentsPile);
    });
  });

  return { pile, setPile, opponentPile } as const;
}
