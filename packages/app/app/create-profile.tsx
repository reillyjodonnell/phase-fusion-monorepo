import { type Socket } from 'socket.io-client';
import { useUser, type User } from './contexts/user-context';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSocket } from './contexts/socket-context';

export function CreateProfile({
  setShowCreateProfile,
}: {
  setShowCreateProfile: (show: boolean) => void;
}) {
  const socket = useSocket();

  const { user, setUser } = useUser();
  function sendProfile() {
    console.log(socket?.connected);
    socket?.emit('updateProfile', user, (user: User) => {
      if (user) {
        setUser(user);
        setShowCreateProfile(false);
      }
    });
  }
  return (
    <View className="flex justify-center items-center">
      <View className="flex justify-center items-center">
        <View className="justify-start py-4 mt-auto mb-auto">
          <Text className="text-4xl py-2 font-extrabold text-center text-[#a1a1aa]">
            Welcome to
          </Text>
          <Text className="text-6xl text-[#fafafa] font-extrabold shadow text-center py-4 ">
            Phase Fusion!
          </Text>
          <Text className="text-6xl text-[#fafafa] font-extrabold shadow text-center py-4 ">
            {user.name}
          </Text>
        </View>
        <TextInput
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="name-phone-pad"
          placeholderTextColor={'white'}
          maxLength={25}
          className="w-72 px-6 py-4  rounded-xl border-[3px] placeholder:text-2xl placeholder:text-white border-white bg-[#ffffff5b]"
          onChange={(value) =>
            setUser({
              ...user,
              name: value.nativeEvent.text,
            })
          }
          placeholder="Enter your name"
        />
      </View>
      <View className="my-2" />
      <TouchableOpacity
        disabled={user.name?.length === 0}
        onPress={sendProfile}
        className={`border ${
          user.name?.length === 0 ? 'bg-gray-400' : 'bg-orange-400'
        } border-white border-[3px] color-white flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50  hover:bg-primary/90 px-8 py-4`}
      >
        <Text className="text-white font-bold text-xl">Create profile</Text>
      </TouchableOpacity>
    </View>
  );
}
