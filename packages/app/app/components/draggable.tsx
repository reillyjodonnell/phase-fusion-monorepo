import React, { ReactNode, useEffect } from 'react';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  withSpring,
  useAnimatedStyle,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
} from 'react-native-reanimated';
import { OVERLAP } from '../lib/constants';

type GestureContext = {
  startX: number;
  startY: number;
  direction: 'left' | 'right' | null;
};

export default function Draggable({
  totalCards,
  cardWidth,
  positions,
  id,
  children,
}: {
  positions: SharedValue<any>;
  id: string;
  totalCards: number;
  cardWidth: number;
  children: ReactNode;
}) {
  const [isMoving, setIsMoving] = React.useState(false);
  const translateY = useSharedValue(0);

  const effectiveCardWidth = cardWidth - OVERLAP;

  const positionForId = positions.value[id];
  const left = useSharedValue(0);

  useEffect(() => {
    left.value = positions.value[id] * effectiveCardWidth;
  }, [totalCards]);

  const zIndices = useSharedValue<number[]>([]);

  function clamp(value: number, lowerBound: number, upperBound: number) {
    'worklet';
    return Math.max(lowerBound, Math.min(value, upperBound));
  }

  useAnimatedReaction(
    () => positions.value[id],
    (currentPosition, previousPosition) => {
      if (currentPosition !== previousPosition) {
        if (!isMoving) {
          left.value = withSpring(currentPosition * effectiveCardWidth);
          //@ts-ignore
          zIndices.value[id] = currentPosition;
          // z index update should happen here
        }
      }
    },
    [isMoving]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const zIndexValue =
      (left.value || 0 / ((totalCards - 1) * effectiveCardWidth)) * totalCards;

    return {
      position: 'absolute',
      left: left.value || 0,
      right: 0,
      bottom: 0,
      zIndex: Math.floor(zIndexValue) ?? 0,
      shadowColor: 'black',
      shadowOffset: {
        height: 0,
        width: 0,
      },
      shadowOpacity: withSpring(isMoving ? 0.2 : 0),
      shadowRadius: 10,
      transform: [{ translateY: translateY.value }],
    };
  });

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: GestureContext) => {
      runOnJS(setIsMoving)(true);
      ctx.startX = left.value; // the initial x-position of the item
      //@ts-ignore
      ctx.initialLeft = left.value; // the initial left value of the item
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      const dragDiff = event.translationX;
      ctx.direction = dragDiff > 0 ? 'right' : 'left';
      translateY.value = ctx.startY + event.translationY;

      //@ts-ignore
      left.value = ctx.initialLeft + dragDiff;
      const newPosition = clamp(
        Math.round(left.value / effectiveCardWidth),
        0,
        totalCards - 1
      );

      const prevPosition = positions.value[id];
      if (newPosition !== prevPosition) {
        if (newPosition > prevPosition) {
          //@ts-ignore
          zIndices.value[id]--;
        } else {
          //@ts-ignore
          zIndices.value[id]++;
        }

        positions.value = objectMove(
          positions.value,
          positions.value[id],
          newPosition
        );
      }
    },
    onEnd: () => {
      left.value = positions.value[id] * effectiveCardWidth;
      translateY.value = withSpring(0, {
        mass: 0.5,
      });
      runOnJS(setIsMoving)(false);
    },
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </PanGestureHandler>
  );
}

function objectMove(object: any, from: number, to: number) {
  'worklet';
  const newObject = Object.assign({}, object);

  for (const id in object) {
    if (object[id] === from) {
      newObject[id] = to;
    } else if (object[id] === to) {
      newObject[id] = from;
    }
  }

  return newObject;
}
