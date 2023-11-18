import { Socket } from 'socket.io-client';
import { View, Text, TouchableOpacity } from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import CheckSVG from './components/check-svg';
import UserSVG from './components/user-svg';
import { useUser, type User } from './contexts/user-context';
import { useSocket } from './contexts/socket-context';

const MAXIMUM_PLAYERS_IN_LOBBY = 2;
const MINIMUM_PLAYERS = 2;

export interface LobbyPlayer extends User {
  isReady: boolean;
}

export type Lobby = {
  id: string;
  createdAt: number;
  roomCode: string;
  maxPlayers: number;
  players: LobbyPlayer[];
};

export function Lobby({
  returnToMenu,
  setGame,
  lobby,
  setLobby,
}: {
  returnToMenu: Function;
  lobby: Lobby;
  // this is a dispatch function
  setLobby: React.Dispatch<React.SetStateAction<Lobby | null>>;
  setGame: Function;
}) {
  const { user } = useUser();
  const socket = useSocket();

  useEffect(() => {
    socket?.on('redirect user to game', (game: any) => {
      setGame(game);
      setLobby(null);
    });
  }, []);

  useEffect(() => {
    socket?.on('player joined', (player) => {
      console.log('Here?');
      // optimistic update
      setLobby((prev: Lobby) => {
        return {
          ...prev,
          players: [player, ...prev.players],
        };
      });
    });
  }, []);

  useEffect(() => {
    socket?.on('player left', (playerId) => {
      // optimistic update
      console.log('Here?');

      setLobby((prev) => {
        return {
          ...prev,
          players: prev.players.filter((player) => player.id !== playerId),
        };
      });
    });
  }, []);

  useEffect(() => {
    socket?.on('player ready update', (playerId, isReady) => {
      console.log('Here?');

      setLobby((prev) => {
        return {
          ...prev,
          players: prev.players.map((player) => {
            if (player.id === playerId) {
              return { ...player, isReady };
            }
            return player;
          }),
        };
      });
    });
  }, []);

  function toggleReady({ ready }: { ready: boolean; id: string }) {
    socket?.emit(
      'toggle player ready',
      ready,
      user.id,
      lobby.roomCode,
      (data: Lobby) => {
        if (!data) {
          return;
        }
      }
    );
    // optimistic update
    console.log('Here?');

    setLobby((prev) => {
      return {
        ...prev,
        players: prev.players.map((player) => {
          if (player.id === user.id) {
            return { ...player, isReady: ready };
          }
          return player;
        }),
      };
    });
  }

  function playGame() {
    socket?.emit('new game', lobby, (gameState: any) => {
      setGame(gameState);
    });
    setLobby(null);
  }

  // if both players ready enable play button
  const enablePlayButton =
    lobby.players.length === MINIMUM_PLAYERS &&
    lobby.players.every((player) => player.isReady);

  return (
    <View className="py-12 w-full h-full flex justify-center items-center">
      <View className="mb-auto flex justify-center items-center">
        <Text className="text-6xl font-extrabold text-white">Lobby</Text>
        {/* Display room code in box */}
        <View className="border-orange-400 border-[4px] p-2 rounded-xl bg-[#ff8c009e]">
          <Text className="text-xl font-extrabold text-white">
            Room code: {lobby.roomCode}
          </Text>
        </View>
      </View>

      <View className="w-3/4">
        {lobby.players.length < MAXIMUM_PLAYERS_IN_LOBBY && (
          <Text className="my-4 text-2xl font-extrabold text-white">
            Waiting for another player...
          </Text>
        )}
        {lobby.players.map((player: any) => {
          if (!player.id) return null;
          return (
            <Player
              key={player.id}
              id={player.id}
              name={player.name}
              isReady={player.isReady}
              isPlayer={user.id === player.id}
              toggleReady={toggleReady}
            />
          );
        })}
      </View>

      <View className="my-12" />
      <TouchableOpacity
        disabled={!enablePlayButton}
        onPress={playGame}
        className={`w-3/4 px-6 py-4 
         border-[3px] color-white flex items-center justify-center 
         rounded-xl text-sm font-medium ring-offset-background 
         transition-colors focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-ring focus-visible:ring-offset-2 
          disabled:pointer-events-none disabled:opacity-50  hover:bg-primary/90 
        ${
          enablePlayButton
            ? 'bg-[#fc903e] border-[#ad7102]'
            : 'bg-[#80808042] border-[#dddddd6d]'
        } `}
      >
        <Text
          className={`${
            enablePlayButton ? 'text-white' : 'text-[#ffffffa6]'
          } font-bold text-3xl mt-auto`}
        >
          Play Game
        </Text>
      </TouchableOpacity>
      <View className="my-2" />

      <TouchableOpacity
        onPress={() => {
          socket?.emit(
            'leave lobby',
            user.id,
            lobby.roomCode,
            (data: Lobby) => {
              if (!data) {
                return;
              }
            }
          );
          returnToMenu();
        }}
        className={`w-3/4 px-6 py-4 bg-[#1b1b1b85] border-[#ffffffbf]
         border-[3px] color-white flex items-center justify-center 
         rounded-xl text-sm font-medium
         transition-colors  
        `}
      >
        <Text className={`text-white font-bold text-3xl mt-auto`}>
          Main Menu
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function Player({
  id,
  name,
  isPlayer,
  toggleReady,
  isReady,
}: {
  id: string;
  name?: string;
  isPlayer: boolean;
  toggleReady: Function;
  isReady: boolean;
}) {
  function onPress() {
    if (toggleReady) {
      toggleReady({ ready: !isReady, id });
    }
  }

  const readyText = isReady ? 'Ready' : isPlayer ? 'Ready?' : 'Not Ready';

  return (
    <TouchableOpacity
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,

        elevation: 6,
      }}
      disabled={!isPlayer}
      onPress={onPress}
      className={`flex flex-row bg-[#7c622b3c] justify-start items-center border-2 border-[#ffffffb8] ${
        isReady && 'border-orange-400 bg-[#88753154]'
      }
      } rounded-xl w-full mb-4 overflow-hidden`}
    >
      <View className="w-16 h-16 justify-center items-center border-2 border-orange-400  rounded-xl  rounded-tl-none rounded-bl-none bg-orange-400">
        <UserSVG className="stroke-white  stroke-2 w-10 h-10" />
        {/* <Text className="text-5xl pl-[4px] pt-[6px]">😁</Text> */}
      </View>
      <Text
        numberOfLines={1}
        className="flex-1 mx-4 text-white text-2xl font-extrabold overflow-ellipsis"
      >
        {isPlayer ? 'You' : name}
      </Text>
      <TouchableOpacity
        disabled={!isPlayer}
        onPress={onPress}
        className={` color-white flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50  hover:bg-primary/90 px-4 `}
      >
        {isReady ? (
          <CheckSVG className="color-white w-12 h-12 stroke-green-400 stroke-[3px]" />
        ) : (
          <Text className="text-white font-bold text-lg">{readyText}</Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
