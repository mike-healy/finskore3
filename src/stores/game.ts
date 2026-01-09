import { defineStore } from 'pinia';

export interface Player {
  id: number;
  name: string;
  scores: number[];
  consecutiveMisses: number;
  eliminated: boolean;
}

export type GameStatus = 'setup' | 'playing' | 'finished';

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
        totalScore: player.scores.reduce((sum, s) => sum + s, 0),
      }));
    },

    sortedByPosition: (state) => {
      const playersWithTotals = state.players.map(player => ({
        ...player,
        totalScore: player.scores.reduce((sum, s) => sum + s, 0),
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

      const totalScore = player.scores.reduce((sum, s) => sum + s, 0);

      // Check for exact win
      if (totalScore === this.targetScore) {
        this.winnerId = player.id;
        this.status = 'finished';
        return;
      }

      // If over 50, reset to 25 (standard Finska rule)
      if (totalScore > this.targetScore) {
        player.scores = [25];
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

      // Re-check win conditions after edit
      this.checkWinConditions();
    },

    checkWinConditions() {
      // Reset winner state
      this.winnerId = null;

      for (const player of this.players) {
        const totalScore = player.scores.reduce((sum, s) => sum + s, 0);

        // If over 50 after edit, reset to 25
        if (totalScore > this.targetScore) {
          player.scores = [25];
          continue;
        }

        if (totalScore === this.targetScore) {
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
