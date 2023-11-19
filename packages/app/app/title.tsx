import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUser } from './contexts/user-context';
import React from 'react';
import { useSocket } from './contexts/socket-context';
import { type Lobby } from './lobby';

export default function Title({
  createLobby,
  redirectToLobby,
}: {
  createLobby: () => void;
  redirectToLobby: (lobby: Lobby) => void;
}) {
  const [roomCode, setRoomCode] = React.useState('');
  const socket = useSocket();
  const [error, setError] = React.useState('');
  const { user } = useUser();
  const { avatar, id, name } = user;

  function joinLobby() {
    setError('');
    socket?.emit('joinLobby', roomCode, user.id, (lobby) => {
      if (lobby) {
        redirectToLobby(lobby);
        return;
      }
      setError('No lobby with that room code');
    });
  }

  return (
    <View className="border-2 border-black bg-[#1e1e1ed5] h-full w-full justify-center items-center">
      <ScrollView
        automaticallyAdjustKeyboardInsets={true}
        contentContainerStyle={{
          display: 'flex',
          minWidth: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <View className="justify-start py-4 mt-auto mb-auto">
          <Text className="text-4xl py-2 font-extrabold text-center text-[#a1a1aa]">
            Welcome {name ? 'back' : ''} to
          </Text>
          <Text className="text-6xl text-[#fafafa] font-extrabold shadow text-center py-4 ">
            Phase Fusion!
          </Text>
          <Text className="text-6xl text-[#fafafa] font-extrabold shadow text-center py-4 ">
            {name}
          </Text>
        </View>
        <View className="mb-auto w-full flex justify-center items-center">
          <View className="w-full flex  justify-center items-center mb-auto">
            <View className="my-2" />
            <TouchableOpacity
              onPress={createLobby}
              className={`w-full min-w-[75%] px-6 py-4  
         border-[3px] color-white flex items-center justify-center 
         rounded-xl text-sm font-medium ring-offset-background 
         transition-colors focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-ring focus-visible:ring-offset-2 
          disabled:pointer-events-none disabled:opacity-50  hover:bg-primary/90 
       bg-[#fc903e] border-[#ad7102]
            `}
            >
              <Text
                className={`text-white
          font-bold text-3xl mt-auto`}
              >
                Create Game
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex justify-center items-center my-6">
            <Text className="text-3xl text-white font-bold">OR</Text>
          </View>
          <View className="w-full justify-center items-center">
            {error && (
              <View className=" min-w-[75%] px-6 py-4 my-4  rounded-xl border-2   border-red-500 bg-[#ff000050]">
                <Text className="text-red-500 text-lg">{error}</Text>
              </View>
            )}
            <TextInput
              onChange={(value) => {
                setError('');
                setRoomCode(value.nativeEvent.text);
              }}
              placeholder="Room code..."
              placeholderTextColor={'white'}
              className="w-full min-w-[75%] px-6 py-4  rounded-xl border-[3px] placeholder:text-2xl placeholder:text-white border-white bg-[#ffffff5b]"
            />

            <TouchableOpacity
              disabled={roomCode.length === 0}
              onPress={joinLobby}
              className={`w-full min-w-[75%] px-6 py-4  mt-4 
         border-[3px] color-white flex items-center justify-center 
         rounded-xl 
       ${
         roomCode.length === 0
           ? 'bg-[#80808042] border-[#dddddd6d]'
           : 'bg-[#fc903e] border-[#ad7102]'
       }
            `}
            >
              <Text
                className={`${
                  roomCode.length === 0 ? 'text-[#ffffffa6]' : 'text-white'
                }
          font-bold text-2xl `}
              >
                Join Game
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
