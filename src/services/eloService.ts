import { UserService } from './userService';

const K_FACTOR = 32; // Constante ELO standard

export function calculateEloChange(
  winnerElo: number,
  loserElo: number
): { winnerNew: number; loserNew: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  const winnerNew = Math.round(winnerElo + K_FACTOR * (1 - expectedWinner));
  const loserNew = Math.round(loserElo + K_FACTOR * (0 - expectedLoser));

  return { winnerNew, loserNew };
}

export function updatePlayerElos(winnerId: number, loserId: number): void {
  const winner = UserService.findById(winnerId);
  const loser = UserService.findById(loserId);

  if (!winner || !loser) return;

  const { winnerNew, loserNew } = calculateEloChange(winner.elo, loser.elo);

  UserService.updateElo(winnerId, winnerNew);
  UserService.updateElo(loserId, loserNew);
  UserService.incrementGamesPlayed(winnerId);
  UserService.incrementGamesPlayed(loserId);
  UserService.incrementGamesWon(winnerId);
}

export function updatePlayerEloDraw(player1Id: number, player2Id: number): void {
  UserService.incrementGamesPlayed(player1Id);
  UserService.incrementGamesPlayed(player2Id);
  // Pas de changement ELO en cas d'égalité
}
