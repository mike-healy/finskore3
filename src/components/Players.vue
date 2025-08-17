<script setup lang="ts">
import { ref, computed } from 'vue';

const players = ref([
  { id: 1, position: 0, name: 'Mike', score: 0 },
  { id: 2, position: 0, name: 'Sarah', score: 0 },
  { id: 3, position: 0, name: 'Jackie', score: 0 },
  { id: 4, position: 0, name: 'Matt', score: 0 },
  { id: 5, position: 0, name: 'Gooseman', score: 0 },
]);

const positions = computed(() => {
  // Extract all of the scores
  let scores: number[] = [];
  players.value.map((player) => scores.push(player.score));

  scores = scores.sort((a, b) => b - a);

  // Retaining duplicates is helpful to do the tied positions, then next player following ties.
  players.value.forEach((player) => {
    player.position = scores.indexOf(player.score) + 1;
  });
});
</script>

<template>
  <ul>
    <li v-for="(player, i) in players" :key="i">
      <span class="position">{{ player.position }}</span>
      {{ player.name }}
      <span>{{ player.score }} pts</span>
      <button @click="player.score++">+</button>
    </li>
  </ul>

  {{  positions }}
</template>

<style>
 li {
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
</style>