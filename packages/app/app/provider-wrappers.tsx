import { SocketProvider } from './contexts/socket-context';
import { UserProvider } from './contexts/user-context';
import { UserIdProvider } from './contexts/user-id-context';

export default function ProviderWrappers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <UserIdProvider>
        <SocketProvider>{children}</SocketProvider>
      </UserIdProvider>
    </UserProvider>
  );
}
