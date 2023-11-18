import React from 'react';
import { type Socket } from 'socket.io-client';

export default function useWaitingForPlayer(socket: Socket) {
  const [waitingMessage, setWaitingMessage] = React.useState<string>(
    'Waiting for another player to join...'
  );

  return [waitingMessage, setWaitingMessage] as const;
}
