import { defineStore } from 'pinia';

export interface Player {
  id: number;
  name: string;
  scores: number[];
  consecutiveMisses: number;
  eliminated: boolean;
}

export type GameStatus = 'setup' | 'playing' | 'finished';

// Compute a player's total from their full score history.
// Standard Finska rule: any turn that takes the running total over the
// target resets the total to 25. The history itself is preserved so past
// turns can still be edited.
export function computeTotal(scores: number[], target = 50): number {
  let total = 0;

  for (const s of scores) {
    total += s;
    if (total > target) total = Math.ceil(target / 2);
  }
  return total;
}

export interface AnnotatedScore {
  score: number;
  runningTotal: number; // total after the (possibly reset) turn
  crashed: boolean;     // this turn pushed the player over the target
}

// Walk a score history and tag the turns where the player busted over
// the target and got reset to 25. Used by the UI to mark crashes inline.
export function annotateScores(scores: number[], target = 50): AnnotatedScore[] {
  let total = 0;

  return scores.map(score => {
    total += score;

    const crashed = total > target;
    if (crashed) total = Math.ceil(target / 2);
    return { score, runningTotal: total, crashed };
  });
}

interface GameState {
  players: Player[];
  targetScore: number;
  status: GameStatus;
  currentPlayerIndex: number;
  winnerId: number | null;
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    players: [],
    targetScore: 50,
    status: 'setup',
    currentPlayerIndex: 0,
    winnerId: null,
  }),

  getters: {
    currentPlayer: (state): Player | null => {
      if (state.players.length === 0) return null;
      return state.players[state.currentPlayerIndex];
    },

    playerScores: (state) => {
      return state.players.map(player => ({
        ...player,
        totalScore: computeTotal(player.scores),
      }));
    },

    sortedByPosition: (state) => {
      const playersWithTotals = state.players.map(player => ({
        ...player,
        totalScore: computeTotal(player.scores),
      }));

      const sorted = [...playersWithTotals].sort((a, b) => b.totalScore - a.totalScore);

      return playersWithTotals.map(player => {
        const position = sorted.findIndex(p => p.totalScore === player.totalScore) + 1;
        return { ...player, position };
      });
    },

    winner: (state): Player | null => {
      if (state.winnerId === null) return null;
      return state.players.find(p => p.id === state.winnerId) || null;
    },
  },

  actions: {
    addPlayer(name: string) {
      if (this.status !== 'setup') return;
      if (!name.trim()) return;

      const newPlayer: Player = {
        id: Date.now(),
        name: name.trim(),
        scores: [],
        consecutiveMisses: 0,
        eliminated: false,
      };
      this.players.push(newPlayer);
    },

    removePlayer(playerId: number) {
      if (this.status !== 'setup') return;
      this.players = this.players.filter(p => p.id !== playerId);
    },

    startGame() {
      if (this.players.length < 2) return;
      this.status = 'playing';
      this.currentPlayerIndex = 0;
    },

    recordScore(score: number) {
      if (this.status !== 'playing') return;

      const player = this.players[this.currentPlayerIndex];
      if (!player || player.eliminated) return;

      player.scores.push(score);

      // Track consecutive misses
      if (score === 0) {
        player.consecutiveMisses++;
        if (player.consecutiveMisses >= 3) {
          player.eliminated = true;
          // Check if only one player remains
          const activePlayers = this.players.filter(p => !p.eliminated);
          if (activePlayers.length === 1) {
            this.winnerId = activePlayers[0].id;
            this.status = 'finished';
            return;
          }
        }
      } else {
        player.consecutiveMisses = 0;
      }

      // Check for exact win. Going over 50 is handled by computeTotal
      // on render, so the score history is preserved for editing.
      if (computeTotal(player.scores, this.targetScore) === this.targetScore) {
        this.winnerId = player.id;
        this.status = 'finished';
        return;
      }

      // Move to next active player
      this.advanceToNextPlayer();
    },

    advanceToNextPlayer() {
      const activePlayers = this.players.filter(p => !p.eliminated);
      if (activePlayers.length === 0) return;

      do {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      } while (this.players[this.currentPlayerIndex].eliminated);
    },

    editScore(playerId: number, scoreIndex: number, newScore: number) {
      const player = this.players.find(p => p.id === playerId);
      if (!player) return;
      if (scoreIndex < 0 || scoreIndex >= player.scores.length) return;

      player.scores[scoreIndex] = newScore;

      this.checkWinConditions();
    },

    checkWinConditions() {
      // Reset winner state
      this.winnerId = null;

      for (const player of this.players) {
        if (computeTotal(player.scores, this.targetScore) === this.targetScore) {
          this.winnerId = player.id;
          this.status = 'finished';
          return;
        }
      }

      // If no winner and status was finished, go back to playing
      if (this.status === 'finished') {
        this.status = 'playing';
      }
    },

    resetGame() {
      this.players = [];
      this.status = 'setup';
      this.currentPlayerIndex = 0;
      this.winnerId = null;
    },

    newGame() {
      // Keep players but reset scores
      this.players.forEach(player => {
        player.scores = [];
        player.consecutiveMisses = 0;
        player.eliminated = false;
      });
      this.status = 'setup';
      this.currentPlayerIndex = 0;
      this.winnerId = null;
    },
  },
});
