import React from 'react';
import { Text, Animated, Pressable, View } from 'react-native';
import {
  TapGestureHandler,
  State,
  PanGestureHandler,
} from 'react-native-gesture-handler';

import { cn } from '../lib/utils';
import { PhaseLayout } from '../phases/phase-container';
import Draggable from './draggable';
import { CARD_WIDTH } from '../lib/constants';

export type Card = {
  id: string;
  number: string | number | undefined;
  color: string | undefined;
  type: 'regular' | 'skip' | 'wild';
};

interface CardProps extends Card {
  className?: string;
  onDoublePress?: Function | null;
  isRaised?: boolean;
  onDrag?: () => void;
  onRelease?: (offset: { x: number; y: number }) => void;
  phaseLayouts: PhaseLayout[];
  highlightPhase: (index: number | null) => void;
  onRaise?: (card: Card) => void;
  onLower?: (card: Card) => void;
}

export function Card({
  number: numberProp,
  color: colorProp,
  type,
  className,
  onDoublePress,
  isRaised,
  onRelease,
  onDragStart,
  onDragEnd,
  id,
  index,
  phaseLayouts,
  highlightPhase,
  onRaise,
  onLower,
}: CardProps & {
  onDragStart?: () => void;
  onDragEnd?: () => void;
  index?: number;
}) {
  const [raised, setRaised] = React.useState(false);
  const [isBeingDragged, setIsBeingDragged] = React.useState(false);
  const [cardInitialPosition, setCardInitialPosition] = React.useState({
    x: 0,
    y: 0,
  });

  const cardRef = React.useRef<Animated.AnimatedComponent<typeof View>>(null);

  const color = colorProp === 'yellow' ? 'gold' : colorProp;
  const raiseValue = React.useRef(new Animated.Value(0)).current;
  const cardStyle = isRaised ? 'shadow-xl transform -translate-y-6' : '';

  const currentValueRef = React.useRef(0); // Ref to keep track of current value

  React.useEffect(() => {
    const listenerId = raiseValue.addListener(({ value }) => {
      currentValueRef.current = value;
    });

    return () => {
      raiseValue.removeListener(listenerId);
    };
  }, []);
  const raisedHeight = 51.2;

  const translateY = raiseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -raisedHeight],
  });

  const handlePress = () => {
    const targetValue = currentValueRef.current < 0.75 ? 1 : 0;

    requestAnimationFrame(() => {
      Animated.spring(raiseValue, {
        toValue: targetValue,
        speed: 10,
        useNativeDriver: true,
      }).start();
    });

    if (targetValue === 1 && onRaise) {
      onRaise({ color: colorProp, number: numberProp, type, id });
    }
    // remove them from the list if their target value is 0
    if (targetValue === 0 && onLower) {
      onLower({ color: colorProp, number: numberProp, type, id });
    }
  };

  const number =
    type === 'regular'
      ? numberProp
      : type === 'skip'
      ? '🙅‍♂️'
      : type === 'wild'
      ? 'W'
      : null;

  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.ACTIVE) {
      onDoublePress ? onDoublePress() : null;
    } else if (
      nativeEvent.state === State.END &&
      nativeEvent.numberOfPointers === 2
    ) {
      if (onDoublePress) {
        onDoublePress();
      } else {
        // initiate drag and reorder functionality here
      }
    }
  };

  const translateX = React.useRef(new Animated.Value(0)).current;
  const translateYGesture = React.useRef(new Animated.Value(0)).current;

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setIsBeingDragged(false);

      onRelease?.({
        x: event.nativeEvent.translationX,
        y: event.nativeEvent.translationY,
      });

      Animated.spring(translateX, {
        toValue: 0,
        speed: 10,
        useNativeDriver: true,
      }).start();
      Animated.spring(translateYGesture, {
        toValue: 0,
        speed: 10,
        useNativeDriver: true,
      }).start();

      if (onDragEnd) onDragEnd();
    } else if (event.nativeEvent.state === State.BEGAN) {
      setIsBeingDragged(true);

      //@ts-ignore
      cardRef.current?.measure((fx, fy, width, height, px, py) => {
        setCardInitialPosition({ x: px, y: py });
      });

      if (onDragStart) onDragStart();

      if (cardRef.current) {
        //@ts-ignore
        cardRef.current.measure((fx, fy, width, height, px, py) => {
          //@ts-ignore
          cardInitialPosition.x = px;
          //@ts-ignore
          cardInitialPosition.y = py;
        });
      }
    }
  };

  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateYGesture,
        },
      },
    ],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const dragPosition = {
          x: cardInitialPosition.x + event.nativeEvent.translationX,
          y: cardInitialPosition.y + event.nativeEvent.translationY,
        };

        // Check if the drag position overlaps with any phase container.
        const overlappingIndex =
          phaseLayouts.length > 0
            ? phaseLayouts.findIndex((layout) => {
                return (
                  dragPosition.x >= layout.x &&
                  dragPosition.x <= layout.x + layout.width &&
                  dragPosition.y >= layout.y &&
                  dragPosition.y <= layout.y + layout.height
                );
              })
            : -1;

        // Highlight the phase container if overlapping.
        highlightPhase(overlappingIndex !== -1 ? overlappingIndex : null);
      },
    }
  );

  return (
    // <PanGestureHandler
    //   onGestureEvent={onPanGestureEvent}
    //   onHandlerStateChange={onPanStateChange}
    //   minDist={10}
    // >
    //   <Animated.View
    //     //@ts-ignore
    //     ref={cardRef}
    //     style={{
    //       transform: [
    //         { translateX: translateX },
    //         { translateY: translateY },
    //         { translateY: translateYGesture },
    //       ],
    //       zIndex: isBeingDragged ? 1000 : 1,
    //       opacity: isBeingDragged ? 0.7 : 1, // <-- Adjust opacity for the dragged card
    //     }}
    //   >
    //     <TapGestureHandler
    //       onHandlerStateChange={onHandlerStateChange}
    //       numberOfTaps={2}
    //     >
    <Pressable onLongPress={handlePress} className={cardStyle}>
      <Animated.View
        style={{
          borderColor: color,
          zIndex: isBeingDragged ? 1000 : 1,
          elevation: raised ? 10 : 1, // Shadow for Android
          shadowOffset: { width: 0, height: raised ? 5 : 2 }, // Shadow for iOS
          shadowRadius: raised ? 10 : 2,
          transform: [{ translateY: translateY }],
        }}
        className={cn(
          `border-2 bg-white rounded-xl p-4 w-20 h-28 relative `,
          className
        )}
      >
        {/* Top Left Number */}
        <Text
          style={{ color: color }}
          className={`absolute top-1 left-1 text-2xl font-extrabold`}
        >
          {number}
        </Text>

        {/* Middle Number */}
        <Text
          style={{ color: color }}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold`}
        >
          {number}
        </Text>

        {/* Bottom Right Number */}
        <Text
          style={{ color: color }}
          className={`absolute bottom-1 right-1 text-2xl font-extrabold`}
        >
          {number}
        </Text>
      </Animated.View>
    </Pressable>

    //     </TapGestureHandler>
    //   </Animated.View>
    // </PanGestureHandler>
  );
}
