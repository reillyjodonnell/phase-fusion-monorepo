import { Animated, Pressable, Text, View } from 'react-native';
import usediscard from './custom-hooks/use-discard';
import { type Socket } from 'socket.io-client';
import { type Card } from './components/card';

export default function DiscardPile({
  socket,
  canPlayerDoAction,
  name,
  setHasDrawn,
  defaultDiscardCard,
  setCards,
}: {
  socket: Socket;
  canPlayerDoAction: boolean;
  name: string;
  setHasDrawn: Function;
  defaultDiscardCard: Card;
  setCards: Function;
}) {
  const { card, onPress } = usediscard(
    socket,
    name,
    () => setHasDrawn(true),
    defaultDiscardCard,
    setCards
  );

  const width = 'w-20';

  if (!card) {
    return (
      <View
        className={`flex ${width} h-32 flex-row justify-center items-center py-12 border-2 border-slate-600 border-dashed bg-[#ffffff57]`}
      ></View>
    );
  }

  const { color, id, number, type } = card;

  // We're not using the <Card /> component here because we can't override the -ml-12 property
  return (
    <View className="flex flex-row bg-gray-500">
      <Pressable onPress={canPlayerDoAction ? onPress : null}>
        <Animated.View
          style={{
            borderColor: card.color,
          }}
          className={`border-2 bg-white rounded-xl p-4 ${width} h-32 relative `}
        >
          {/* Top Left Number */}
          <Text
            style={{ color }}
            className={`absolute top-1 left-1 text-2xl font-extrabold`}
          >
            {number}
          </Text>

          {/* Middle Number */}
          <Text
            style={{ color }}
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold`}
          >
            {number}
          </Text>

          {/* Bottom Right Number */}
          <Text
            style={{ color }}
            className={`absolute bottom-1 right-1 text-2xl font-extrabold`}
          >
            {card.number}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}
