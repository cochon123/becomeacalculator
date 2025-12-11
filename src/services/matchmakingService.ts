interface QueueEntry {
  userId: number;
  username: string;
  elo: number;
  timestamp: number;
}

class MatchmakingQueue {
  private queue: QueueEntry[] = [];
  private readonly ELO_RANGE_BASE = 100;
  private readonly ELO_RANGE_EXPAND = 50; // Par tranche de 10 secondes
  private readonly MAX_WAIT_TIME = 60000; // 60 secondes

  addPlayer(userId: number, username: string, elo: number): void {
    // Retirer d'abord si déjà présent
    this.removePlayer(userId);
    
    this.queue.push({
      userId,
      username,
      elo,
      timestamp: Date.now(),
    });
  }

  removePlayer(userId: number): void {
    this.queue = this.queue.filter(entry => entry.userId !== userId);
  }

  findMatch(userId: number): { player1: QueueEntry; player2: QueueEntry } | null {
    const player = this.queue.find(entry => entry.userId === userId);
    if (!player) return null;

    const waitTime = Date.now() - player.timestamp;
    const eloRange = this.ELO_RANGE_BASE + Math.floor(waitTime / 10000) * this.ELO_RANGE_EXPAND;

    // Chercher un adversaire dans la plage ELO
    const opponent = this.queue.find(entry => {
      if (entry.userId === userId) return false;
      const eloDiff = Math.abs(entry.elo - player.elo);
      return eloDiff <= eloRange;
    });

    if (opponent) {
      this.removePlayer(player.userId);
      this.removePlayer(opponent.userId);
      return { player1: player, player2: opponent };
    }

    return null;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isInQueue(userId: number): boolean {
    return this.queue.some(entry => entry.userId === userId);
  }

  // Nettoyer les anciennes entrées (timeout)
  cleanup(): void {
    const now = Date.now();
    this.queue = this.queue.filter(entry => {
      return now - entry.timestamp < this.MAX_WAIT_TIME;
    });
  }
}

export const matchmakingQueue = new MatchmakingQueue();

// Nettoyer la queue toutes les 30 secondes
setInterval(() => {
  matchmakingQueue.cleanup();
}, 30000);
