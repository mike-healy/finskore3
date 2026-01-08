<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '@/stores/game';

const store = useGameStore();

const players = computed(() => store.players);

const positions = computed(() => {
  let scores: number[] = [];
  players.value.map((player) => scores.push(player.score));

  scores = scores.sort((a, b) => b - a);

  // Retaining duplicates is helpful to count positions whilst handling ties
  players.value.forEach((player) => {
    player.position = scores.indexOf(player.score) + 1;
  });
});

const recordScore = (player: any, score: number) => {
  player.score += score;
  // player.scores.push(score); // will move to history array later
};

</script>

<template>
  <ul class="leaderboard">
    <li v-for="(player, i) in players" :key="i">
      <span class="position">{{ player.position }}</span>
      {{ player.name }}
      <span>{{ player.score }} pts</span>
      <!-- <button @click="player.score++">+</button> -->
      <div class="score-buttons">
        <button @click="recordScore(player, 0)">X</button>
        <button @click="recordScore(player, 1)">1</button>
        <button @click="recordScore(player, 2)">2</button>
        <button @click="recordScore(player, 3)">3</button>
        <button @click="recordScore(player, 4)">4</button>
        <button @click="recordScore(player, 5)">5</button>
        <button @click="recordScore(player, 6)">6</button>
        <button @click="recordScore(player, 7)">7</button>
        <button @click="recordScore(player, 8)">8</button>
        <button @click="recordScore(player, 9)">9</button>
        <button @click="recordScore(player, 10)">10</button>
        <button @click="recordScore(player, 11)">11</button>
        <button @click="recordScore(player, 12)">12</button>
      </div>
    </li>
  </ul>

  {{ positions }}
</template>

<style>
ul.leaderboard {
  max-width: 400px;
}

.leaderboard li {
  display: grid;
  grid-template-columns: 3ch 1fr 8ch 4ch;
  column-gap: 1rem;
  padding: 3px 0;
}

span.position {
  background: rgb(122, 107, 168); color: white;
  padding: 0.25rem;
  font-weight: 700;
}

.score-buttons {
  display: flex;
  gap: 0.5rem;
}
</style>