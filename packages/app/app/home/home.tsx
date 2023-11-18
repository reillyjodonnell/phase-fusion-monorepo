import { Text } from 'react-native';
import { CreateProfile } from '../create-profile';
import GameManager from '../game-manager';
import { Lobby as LobbyComponent } from '../lobby';
import Title from '../title';
import { useHome } from './use-home';

export function Home() {
  const {
    game,
    showCreateProfile,
    createLobby,
    error,
    joinLobby,
    lobby,
    setLobby,
    returnToMenu,
    roomCodeInput,
    setError,
    setGame,
    setRoomCodeInput,
    setShowCreateProfile,
    canRejoin,
  } = useHome();

  if (game) return <GameManager game={game} />;

  console.log('lobby', lobby);

  // if (canRejoin) {
  //   return <Text>User has previous existing game</Text>;
  // }

  if (lobby) {
    console.log('We have lobby and are returning the Lobby component!');
    return (
      <LobbyComponent
        lobby={lobby}
        setLobby={setLobby}
        returnToMenu={returnToMenu}
        setGame={setGame}
      />
    );
  }

  if (showCreateProfile) {
    return <CreateProfile setShowCreateProfile={setShowCreateProfile} />;
  }

  return <Title createLobby={createLobby} redirectToLobby={joinLobby} />;
}
