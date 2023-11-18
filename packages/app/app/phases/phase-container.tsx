import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Card } from '../components/card';
import {
  canAddToPile,
  retrievePhasesPromptFromNumber,
} from './helpers/phases-helper';

const MAX_PHASES = 10;

export type PhaseLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function PhaseContainer({
  phaseNumber,
  onLayoutChange,
  highlightedPhase,
  phaseCompletions,
  isPhaseComplete,
  pile,
  playOnPile,
  selectedCards,
}: {
  phaseNumber: number;
  onLayoutChange?: (index: number, layout: PhaseLayout) => void;
  highlightedPhase: number | null;
  phaseCompletions?: boolean[];
  isPhaseComplete: boolean;
  pile?: [Card[], Card[]];
  playOnPile?: Function;
  selectedCards?: Card[];
}) {
  const phases = retrievePhasesPromptFromNumber(phaseNumber);
  return (
    <View className="flex justify-center items-center my-4 relative">
      <View className="flex flex-row">
        {phases.map((phase, index) => {
          const canPlayOnPile =
            isPhaseComplete && pile && selectedCards
              ? canAddToPile(pile[index], selectedCards)
              : false;

          return (
            <PhaseDropzone
              onPress={() => {
                playOnPile && canPlayOnPile ? playOnPile(index) : {};
              }}
              cards={pile ? pile[index] : []}
              isComplete={
                isPhaseComplete ||
                (phaseCompletions ? phaseCompletions[index] : false)
              }
              onLayoutChange={onLayoutChange}
              phase={phase}
              showHighlight={canPlayOnPile}
              key={index}
              index={index}
            />
          );
        })}
      </View>
      <Text className="text-xl text-slate-200 px-4 py-2 font-extrabold">
        Phase {phaseNumber} / {MAX_PHASES}
      </Text>
    </View>
  );
}

function PhaseDropzone({
  showHighlight,
  isComplete,
  phase,
  index,
  onLayoutChange,
  cards,
  onPress,
}: {
  showHighlight: boolean;
  isComplete: boolean;
  phase: string;
  index: number;
  onLayoutChange?: (index: number, layout: PhaseLayout) => void;
  cards?: Card[];
  onPress?: Function;
}) {
  return (
    <View
      onLayout={(event) => {
        const layout = event.nativeEvent.layout;
        onLayoutChange &&
          onLayoutChange(index, {
            x: layout.x,
            y: layout.y,
            width: layout.width,
            height: layout.height,
          });
      }}
      //Attach the layout event to capture the position
      className={`mx-2 w-32 h-24  border-2 justify-center items-center border-slate-600 border-dashed 
              ${
                isComplete
                  ? 'border-green-400 border-[6px] bg-[#0ebc0e45]'
                  : ' '
              } 
              ${
                showHighlight
                  ? 'border-orange-400 bg-[#ffa60073] border-[6px]'
                  : ''
              }
              
              `}
    >
      <Text className="text-xl text-white font-bold ">{phase}</Text>
      <View className="flex flex-row justify-center items-center">
        {cards && cards.length > 0
          ? cards.map(({ color: colorProp, id, number: numberProp, type }) => {
              const color = colorProp === 'yellow' ? 'gold' : colorProp;

              const number =
                type === 'regular'
                  ? numberProp
                  : type === 'skip'
                  ? '🙅‍♂️'
                  : type === 'wild'
                  ? 'W'
                  : null;
              return (
                <Pressable key={id} onPress={() => (onPress ? onPress() : {})}>
                  <View
                    style={{
                      borderColor: color,
                    }}
                    className={`border-2 bg-white rounded-xl p-1 w-12 h-16 relative -ml-6`}
                  >
                    {/* Top Left Number */}
                    <Text
                      style={{ color: color }}
                      className={`absolute top-1 left-1 text-lg font-extrabold`}
                    >
                      {number}
                    </Text>

                    {/* Middle Number */}
                    <Text
                      style={{ color: color }}
                      className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold`}
                    >
                      {number}
                    </Text>

                    {/* Bottom Right Number */}
                    <Text
                      style={{ color: color }}
                      className={`absolute bottom-1 right-1 text-lg font-extrabold`}
                    >
                      {number}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          : null}
      </View>
    </View>
  );
}
