import { Pressable, Text, View } from 'react-native';
import { Card as CardType } from './components/card';
import React, { useEffect } from 'react';
import { type Socket } from 'socket.io-client';
import Deck from './components/deck';
import { cn } from './lib/utils';
import { UsersCards } from './users-cards';
import { PhaseContainer, PhaseLayout } from './phases/phase-container';
import SendSVG from './components/send-svg';
import XSVG from './components/x-svg';
import { evaluatePhaseCompletion } from './phases/helpers/phases-helper';
import usePlayersTurn from './custom-hooks/use-players-turn';
import usePile from './custom-hooks/use-pile';
import DiscardPile from './discard-pile';
import { SocketData } from '@phase-fusion/shared/socket';
import { SocketType } from './contexts/socket-context';
import { useUser } from './contexts/user-context';

export default function Game({
  roomCode,
  name,
  socket,
  currentPhase,
  opponentName,
  opponentsPhaseNumber,
  setCards,
  cards,
  initialDiscardCard,
  isPlayersTurn: defaultIsPlayersTurn,
}: {
  roomCode: string;
  name: string;
  socket: SocketType;
  currentPhase: number;
  opponentName: string;
  opponentsPhaseNumber: number;
  setCards: Function;
  cards: CardType[];
  initialDiscardCard: CardType;
  isPlayersTurn: boolean;
}) {
  console.log(roomCode);
  // state
  const [opponentCardLength, setOpponentCardLength] = React.useState(10);
  const [hasDrawn, setHasDrawn] = React.useState(false);
  const [hasDiscarded, setHasDiscarded] = React.useState(false);
  const [drawnCard, setDrawnCard] = React.useState<CardType | null>(null);
  const [selectedCards, setSelectedCards] = React.useState<CardType[]>([]);
  const [isPhaseComplete, setIsPhaseComplete] = React.useState(false);
  const [phaseLayouts, setPhaseLayouts] = React.useState<PhaseLayout[]>([]);
  const [highlightedPhase, setHighlightedPhase] = React.useState<number | null>(
    null
  );

  // custom hooks
  const { pile, setPile, opponentPile } = usePile(socket);
  const [isPlayersTurn] = usePlayersTurn(
    socket,
    setHasDiscarded,
    setHasDrawn,
    defaultIsPlayersTurn
  );

  const { user } = useUser();

  useEffect(() => {
    socket.on('cards', (cards, opponentsCardsLength, drawnCard) => {
      setCards(cards);
      setOpponentCardLength(opponentsCardsLength);
      setSelectedCards([]);
      if (drawnCard) {
        setDrawnCard(drawnCard);
        return;
      }
      setDrawnCard(null);
    });
  }, []);

  useEffect(() => {
    socket.on('disconnect', (reason) => {
      // when disconnected let's have a pop up and redirect to home screen
    });
  }, [socket]);

  const [set1, set2, set1Cards, set2Cards] = evaluatePhaseCompletion(
    selectedCards,
    currentPhase
  );

  function playOnOwnPile(index: number) {
    if (!canPlayerDoAction) return;

    socket.emit('play on pile', name, name, index, selectedCards);
  }

  function playOnOpponentPile(index: number) {
    if (!canPlayerDoAction) return;
    socket.emit('play on pile', name, opponentName, index, selectedCards);
  }

  function drawFromDeck() {
    if (!canPlayerDrawCard) return;
    setHasDrawn(true);
    socket.emit('drawFromDeck', roomCode, user.id);
  }

  function submitPhase() {
    if (!canPlayerDoAction) return;

    // we need to pass the index of the pile with the cards from that index

    socket.emit('phase complete', name, currentPhase, {
      set1: set1Cards,
      set2: set2Cards,
    });
    setIsPhaseComplete(true);

    // ⚡️ optimistic updating
    setCards((cards: CardType[]) =>
      cards.filter((card: CardType) => !selectedCards.includes(card))
    );
    setSelectedCards([]);
    setPile([set1Cards, set2Cards]);
  }

  const canPlayerDrawCard = isPlayersTurn && !hasDrawn && !hasDiscarded;

  const canPlayerDoAction = isPlayersTurn && hasDrawn && !hasDiscarded;

  const showSubmitButton =
    canPlayerDoAction && set1 && set2 && selectedCards.length > 0;

  if (!name) return;

  return (
    <>
      <View className="justify-center items-center">
        <Opponent
          playOnPile={playOnOpponentPile}
          pile={opponentPile}
          name={opponentName ?? 'Opponent'}
          socket={socket}
          numberOfCards={opponentCardLength}
          selectedCards={selectedCards}
          isPhaseComplete={isPhaseComplete}
          phaseNumber={opponentsPhaseNumber}
        />
        <View className="my-2">
          {isPlayersTurn ? (
            <Text className="text-4xl text-white font-bold">
              It's your turn!
            </Text>
          ) : (
            <Text className="text-4xl text-white font-bold">
              👆 It's their turn!
            </Text>
          )}
        </View>
      </View>

      <View className="flex flex-row w-full justify-evenly items-center">
        {selectedCards.length > 0 ? (
          <Pressable
            onPress={() => setSelectedCards([])}
            className=" bg-red-400 border-2 rounded-xl border-white px-6 py-4  text-white  z-10 "
          >
            <XSVG className="w-8 h-8 stroke-2 stroke-white" />
          </Pressable>
        ) : null}

        <View className="mr-4 ml-8 ">
          <Deck onPress={drawFromDeck} count={10} />
        </View>
        <View className=" ml-8 ">
          <DiscardPile
            socket={socket}
            setHasDrawn={setHasDrawn}
            canPlayerDoAction={canPlayerDrawCard}
            name={name}
            defaultDiscardCard={initialDiscardCard}
            setCards={setCards}
          />
        </View>
        {showSubmitButton ? (
          <Pressable
            onPress={submitPhase}
            className="mb-2 bg-green-400 border-2 rounded-xl border-white px-6 py-4  text-white z-10 "
          >
            <SendSVG className="w-8 h-8 stroke-2 stroke-white" />
          </Pressable>
        ) : null}
      </View>
      <PhaseContainer
        selectedCards={selectedCards}
        playOnPile={playOnOwnPile}
        pile={pile}
        isPhaseComplete={isPhaseComplete}
        phaseNumber={currentPhase}
        onLayoutChange={(index: number, layout: any) => {
          const updatedLayouts = [...phaseLayouts];
          updatedLayouts[index] = layout;
          setPhaseLayouts(updatedLayouts);
        }}
        highlightedPhase={highlightedPhase}
        phaseCompletions={[set1, set2]}
      />
      {cards.length > 0 ? (
        <UsersCards
          setSelectedCards={setSelectedCards}
          setHighlightedPhase={setHighlightedPhase}
          setCards={setCards}
          name={name}
          socket={socket}
          cards={cards}
          setDrawnCard={setDrawnCard}
          drawnCard={drawnCard}
          phaseLayouts={phaseLayouts}
          hasDiscarded={hasDiscarded}
          setHasDiscarded={setHasDiscarded}
        />
      ) : null}
    </>
  );
}

function Opponent({
  name,
  socket,
  numberOfCards,
  pile,
  playOnPile,
  selectedCards,
  isPhaseComplete,
  phaseNumber,
}: {
  socket: Socket;
  name: string;
  numberOfCards: number;
  pile: [CardType[], CardType[]];
  isPhaseComplete: boolean;
  phaseNumber: number;
  playOnPile?: Function;
  selectedCards?: CardType[];
}) {
  return (
    <View className="flex justify-center items-center relative">
      <View className="flex justify-center items-center">
        <View className="rounded-xl border-orange-400 border-[3px] bg-[#fb8e4070]">
          <Text className="text-3xl p-2">🧙</Text>
        </View>
        <Text className="text-xl font-bold text-orange-400">{name}</Text>
      </View>
      <View className="absolute items-center justify-center -translate-y-24 translate-x-20">
        <View
          style={{
            elevation: 1, // Slight shadow increase for depth illusion
            shadowOffset: { width: 0, height: 2 }, // Shadow for iOS
            shadowRadius: 2,
            shadowOpacity: 0.2,
          }}
          className={cn(
            'bg-orange-400 border-2 border-slate-400 rounded-sm w-12 h-16 justify-center items-center'
          )}
        >
          <Text className="font-bold text-xl text-white">{numberOfCards}</Text>
        </View>
      </View>
      <PhaseContainer
        selectedCards={selectedCards}
        playOnPile={playOnPile}
        pile={pile}
        isPhaseComplete={isPhaseComplete}
        phaseNumber={phaseNumber}
        highlightedPhase={null}
      />
    </View>
  );
}
