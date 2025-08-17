<script setup lang="ts">
import Players from './Players.vue';
import { ref } from 'vue';
import { useGameStore } from '@/stores/game';

const store = useGameStore();

const newPlayerName = ref('');
</script>

<template>
  <div>
    <h1>Finskore component</h1>

    <h2>Players</h2>
    <ul>
      <li v-for="player in store.players" :key="player.id">
        {{ player.name }} / <span style="color: gray;">{{ player.score }}</span>
      </li>
    </ul>

    <input type="text" placeholder="Player name" v-model="newPlayerName">
    <button @click="store.addPlayer(newPlayerName)">Add Player</button>

    <Players />
  </div>
</template>
