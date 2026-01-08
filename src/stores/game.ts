import { defineStore } from 'pinia';

interface Player {
  id: number,
  name: string,
  score: number,
  scores: number[],
  position: number,
  misses: number,
}

interface GameState {
  players: Player[],
  targetScore: number,
}

export const useGameStore = defineStore('game', {
  state: () => ({
    players: [] as Player[],
    targetScore: 50,
  }),

  actions: {
    addPlayer(name: string) {
      const newPlayer: Player = {
        id: this.players.length + 1,
        name,
        score: 0,
        position: 0,
        misses: 0,
      };
      this.players.push(newPlayer);
    },

    setTargetScore(score: number) {
      this.targetScore = Math.max(1, score);
    }
  }

  // actions, getters optional
});
