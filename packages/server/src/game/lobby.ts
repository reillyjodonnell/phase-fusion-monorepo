export const WAITING_FOR_PLAYER = 1;
export const GAME_START_COUNT = 2;

export function handleSinglePlayer(socket: any): void {
  //console.log('waiting for player');
  socket.emit('waiting for player');
}
