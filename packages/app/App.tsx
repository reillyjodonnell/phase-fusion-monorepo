import React from 'react';
import { Home } from './app/home/home';
import ProviderWrappers from './app/provider-wrappers';
import { ImageBackground, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';

export default function App() {
  // const [fontsLoaded] = useFonts({
  //   Orbitron: require('./assets/fonts/Orbitron-Black.ttf'),
  // });

  // if (!fontsLoaded) return null;

  return (
    <Wrapper>
      <Home />
    </Wrapper>
  );
}

export function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProviderWrappers>
      <SafeAreaView className="h-full w-full flex-1 bg-black">
        <GestureHandlerRootView className="flex-1">
          <ImageBackground
            resizeMode="cover"
            source={require('./assets/space-hi-res.png')}
            className="flex-1 justify-center items-center"
          >
            {children}
          </ImageBackground>
        </GestureHandlerRootView>
      </SafeAreaView>
    </ProviderWrappers>
  );
}
