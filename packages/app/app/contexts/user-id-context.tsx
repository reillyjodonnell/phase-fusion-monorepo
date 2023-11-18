import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

type UserIdContextType = {
  userId: string | null;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
  deleteAsyncStorageId: () => Promise<void>;
  setAsyncStorageId: (value: string) => Promise<void>;
  fetching: boolean;
};

const userIdContext = React.createContext<UserIdContextType | null>(null);

export function UserIdProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [fetching, setFetching] = React.useState(true);

  async function setAsyncStorageId(value: string) {
    await AsyncStorage.setItem('phase-fusion-id', value);
  }

  async function deleteAsyncStorageId() {
    await AsyncStorage.removeItem('phase-fusion-id');
  }

  React.useEffect(() => {
    async function reset() {
      const res = await AsyncStorage.removeItem('phase-fusion-id');
    }
    // reset();
  }, []);

  React.useEffect(() => {
    async function retrieve() {
      try {
        const res = await AsyncStorage.getItem('phase-fusion-id');
        setUserId(res);
        setFetching(false);
      } catch (e) {
        console.log(e);
        // saving error
        setFetching(false);
      }
    }
    retrieve();
  }, []);

  return (
    <userIdContext.Provider
      value={{
        userId,
        setUserId,
        setAsyncStorageId,
        deleteAsyncStorageId,
        fetching,
      }}
    >
      {children}
    </userIdContext.Provider>
  );
}

export function useUserId() {
  const context = React.useContext(userIdContext);
  if (context === null) {
    throw new Error('useUserId must be used within a UserIdProvider');
  }
  return context;
}
