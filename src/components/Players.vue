<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '@/stores/game';

const props = withDefaults(defineProps<{
  showControls?: boolean;
}>(), {
  showControls: true,
});

const store = useGameStore();

const editingScore = ref<{ playerId: number; scoreIndex: number } | null>(null);
const editValue = ref(0);

const playersWithPositions = computed(() => {
  return store.sortedByPosition;
});

const getPlayerTotal = (scores: number[]) => {
  return scores.reduce((sum, s) => sum + s, 0);
};

const isCurrentPlayer = (playerId: number) => {
  return store.currentPlayer?.id === playerId;
};

const startEdit = (playerId: number, scoreIndex: number, currentValue: number) => {
  editingScore.value = { playerId, scoreIndex };
  editValue.value = currentValue;
};

const saveEdit = () => {
  if (editingScore.value) {
    store.editScore(editingScore.value.playerId, editingScore.value.scoreIndex, editValue.value);
    editingScore.value = null;
  }
};

const cancelEdit = () => {
  editingScore.value = null;
};

const handleEditKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    saveEdit();
  } else if (event.key === 'Escape') {
    cancelEdit();
  }
};
</script>

<template>
  <div>
    <!-- Current Turn Indicator -->
    <div v-if="props.showControls && store.currentPlayer">
      <h2>{{ store.currentPlayer.name }}'s Turn</h2>
      <p>Current score: {{ getPlayerTotal(store.currentPlayer.scores) }} / {{ store.targetScore }}</p>

      <div class="score-buttons">
        <button @click="store.recordScore(0)">X</button>
        <button v-for="n in 12" :key="n" @click="store.recordScore(n)">{{ n }}</button>
      </div>
    </div>

    <h3>Leaderboard</h3>
    <ul class="leaderboard">
      <li v-for="player in playersWithPositions" :key="player.id" :class="{ current: isCurrentPlayer(player.id), eliminated: player.eliminated }">
        <div class="player-row">
          <span class="position">{{ player.eliminated ? 'X' : player.position }}</span>
          <span class="name">
            {{ player.name }}
            <span v-if="player.consecutiveMisses > 0 && !player.eliminated" class="misses">
              ({{ player.consecutiveMisses }} miss{{ player.consecutiveMisses > 1 ? 'es' : '' }})
            </span>
            <span v-if="player.eliminated" class="eliminated-label">(Eliminated)</span>
          </span>
          <span class="score">{{ player.totalScore }} pts</span>
        </div>

        <!-- Score History -->
        <div class="score-history" v-if="player.scores.length > 0">
          <span>Scores: </span>
          <span v-for="(score, index) in player.scores" :key="index" class="score-item">
            <template v-if="editingScore?.playerId === player.id && editingScore?.scoreIndex === index">
              <input
                type="number"
                v-model.number="editValue"
                min="0"
                max="12"
                @keydown="handleEditKeyPress"
                @blur="saveEdit"
                class="edit-input"
              >
            </template>
            <template v-else>
              <button
                @click="startEdit(player.id, index, score)"
                class="score-value"
                :title="'Click to edit'"
              >{{ score }}</button>
            </template>
            <span v-if="index < player.scores.length - 1">, </span>
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style>
.score-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.score-buttons button {
  min-width: 2.5rem;
  padding: 0.5rem;
}

ul.leaderboard {
  list-style: none;
  padding: 0;
  max-width: 500px;
}

.leaderboard li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #ccc;
}

.leaderboard li.current {
  background: #f0f0f0;
}

.player-row {
  display: grid;
  grid-template-columns: 3ch 1fr 8ch;
  column-gap: 1rem;
  align-items: center;
}

span.position {
  background: rgb(122, 107, 168);
  color: white;
  padding: 0.25rem;
  font-weight: 700;
  text-align: center;
}

.score-history {
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: #666;
}

.score-value {
  background: none;
  border: 1px solid transparent;
  padding: 0 0.25rem;
  cursor: pointer;
  font-size: inherit;
}

.score-value:hover {
  border-color: #999;
}

.edit-input {
  width: 3rem;
}

.leaderboard li.eliminated {
  opacity: 0.5;
  text-decoration: line-through;
}

.misses {
  color: orange;
  font-size: 0.85em;
}

.eliminated-label {
  color: red;
  font-size: 0.85em;
}
</style>
