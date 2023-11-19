import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserId } from './user-id-context';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@phase-fusion/shared/socket';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

// 1. Create a SocketContext
const SocketContext = createContext<SocketType | null>(null);

export const useSocket = () => {
  // make sure the socket actually exists and isn't null
  if (!SocketContext) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId, setAsyncStorageId, fetching } = useUserId();
  const [socketRef, setSocketRef] = useState<SocketType | null>(null);

  useEffect(() => {
    if (fetching) return;

    if (socketRef) return;

    const connection: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      'http://192.168.86.30:3000',
      {
        auth: {
          token: userId,
        },
      }
    );

    setSocketRef(connection);

    async function tokenCallback(token: string) {
      try {
        await setAsyncStorageId(token);
      } catch (err) {}
      //@ts-ignore
      connection.auth.token = token;
    }

    connection.on('token', tokenCallback);

    return () => {
      if (connection) {
        connection.disconnect();
      }
    };
  }, [fetching, userId, setAsyncStorageId]);

  return (
    // 3. Provide the socket instance to the rest of your app
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
};
