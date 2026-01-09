<script setup lang="ts">
import Players from './Players.vue';
import { ref } from 'vue';
import { useGameStore } from '@/stores/game';

const store = useGameStore();

const newPlayerName = ref('');

const addPlayer = () => {
  if (newPlayerName.value.trim()) {
    store.addPlayer(newPlayerName.value);
    newPlayerName.value = '';
  }
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    addPlayer();
  }
};
</script>

<template>
  <div>
    <h1>Finskore</h1>

    <!-- Setup Phase -->
    <div v-if="store.status === 'setup'">
      <h2>Add Players</h2>
      <p v-if="store.players.length === 0">Add at least 2 players to start the game.</p>

      <ul v-if="store.players.length > 0">
        <li v-for="player in store.players" :key="player.id">
          {{ player.name }}
          <button @click="store.removePlayer(player.id)">Remove</button>
        </li>
      </ul>

      <div>
        <input
          type="text"
          placeholder="Player name"
          v-model="newPlayerName"
          @keypress="handleKeyPress"
        >
        <button @click="addPlayer">Add Player</button>
      </div>

      <div v-if="store.players.length >= 2">
        <button @click="store.startGame()">Start Game</button>
      </div>
      <p v-else-if="store.players.length > 0">
        Add {{ 2 - store.players.length }} more player(s) to start.
      </p>
    </div>

    <!-- Playing Phase -->
    <div v-else-if="store.status === 'playing'">
      <Players />
    </div>

    <!-- Finished Phase -->
    <div v-else-if="store.status === 'finished'">
      <h2>Game Over!</h2>
      <p v-if="store.winner">{{ store.winner.name }} Wins!</p>

      <h3>Final Scores</h3>
      <Players :showControls="false" />

      <div>
        <button @click="store.newGame()">Play Again (Same Players)</button>
        <button @click="store.resetGame()">New Game (Reset All)</button>
      </div>
    </div>
  </div>
</template>
