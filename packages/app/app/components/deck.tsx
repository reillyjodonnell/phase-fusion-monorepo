import React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '../lib/utils';

export default function Deck({ count = 5, onPress = () => {} }) {
  return (
    <Pressable onPress={onPress}>
      <View className="flex flex-row items-center justify-center relative">
        {[...Array(count)].reverse().map((_, index) => (
          <View
            key={index}
            style={{
              zIndex: index, // This ensures that the cards on top have a higher zIndex
              // transform: [{ translateY: index * 2 }], // Small offset for stacked appearance
              elevation: index + 1, // Slight shadow increase for depth illusion
              shadowOffset: { width: 0, height: 2 }, // Shadow for iOS
              shadowRadius: 2,
              shadowOpacity: 0.2,
            }}
            className={cn(
              ' absolute bg-orange-400 border-2 border-gray-300 rounded-xl p-4 w-20 h-32 m-1'
            )}
          />
        ))}
      </View>
    </Pressable>
  );
}
