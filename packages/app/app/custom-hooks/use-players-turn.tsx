import React, { Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';

export default function usePlayersTurn(
  socket: Socket,
  setHasDrawn: Function,
  setHasDiscarded: Function,
  defaultIsPlayersTurn = false
) {
  const [isPlayersTurn, setIsPlayersTurn] =
    React.useState(defaultIsPlayersTurn);
  React.useEffect(() => {
    socket.on('turn', (value) => {
      setHasDiscarded(false);
      setHasDrawn(false);
      setIsPlayersTurn(value);
    });
  });
  return [isPlayersTurn, setIsPlayersTurn] as const;
}
