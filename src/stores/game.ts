import { defineStore } from 'pinia';

interface Player {
  id: number,
  name: string,
  score: number,
  // strikes
}

interface GameState {
  players: Player[],
  targetScore: number,
}

export const useGameStore = defineStore('game', {
  state: () => ({
    players: [] as Player[],
    targetScore: 50
  }),

  actions: {
    addPlayer(name: string) {
      const newPlayer: Player = {
        id: this.players.length + 1,
        name,
        score: 0
      };
      this.players.push(newPlayer);
    },

    setTargetScore(score: number) {
      this.targetScore = score;
    }
  }

  // actions, getters optional
});
