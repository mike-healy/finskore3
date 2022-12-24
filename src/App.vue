<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="container">
    <h1>Finskore</h1>
    <p>A free browser-based scoring app for Finska, Klop &amp; Molkky</p>
  </header>

  <section>
    <h2>CODE MIGRATION</h2>
    <ul>
      <li>Use Pina instead of events?</li>
      <li>Migrating components</li>
      <li>Playright testing</li>
    </ul>
  </section>

  <p v-show="!gameInProgress" class="center">
    <button @click="openNewGameInterface()">Add Players</button>
    <button v-show="players.length >= 2" @click="runShuffleOrder()" class="cancel" style="margin-left: 1rem;">Shuffle Order</button>
  </p>

  <div class="controls">
    <div>
        <p>Play to <br>
        <input type="number" v-model.number="playToScore" max="1000"></p>
    </div>
    
    <div>
        <img src="img/arrangement.png" class="arrangement" @click="showArrangementGuide = !showArrangementGuide" alt="Show arrangement">
    </div>

    <div class='themeSwitcher'>
        <div @click="setTheme('white')" class='white'></div>
        <div @click="setTheme('default')" class='default'></div>
        <div @click="setTheme('hot')" class='hot'></div>
    </div>
  </div>
  
  <!-- <RouterView /> -->
</template>

<script>
export default {
  data() {
    return {
      shufflerInterval: null,
      shuffleCount: 0,

      theme: 'default',
      christmas: false,
      bday: '',
      showArrangementGuide: false,

      //Config
      playToScore: 50,
      players: [],

      //State
      selectedPlayer: undefined, //instance of current player being scored
      whoseTurn:  0,   //index

      gameInProgress: false,
      showNewGameInterface: false,
      showScoreModal: false,
      newPlayer: '',
      winner: '',

      flashMessage: ''
    }
  },

  methods: {
    changeWhoseTurnItIs(playerId) {
      const selectedPlayer = this.players.find((player) => (player.id === playerId));
      const selectedPlayerIndex = this.players.indexOf(selectedPlayer)
      this.whoseTurn = selectedPlayerIndex;
      this.showScoreModal = false;
    },
    closeSelectedPlayer() {
      this.showScoreModal = false;
    },
    openNewGameInterface() {
        this.showNewGameInterface = true;
    },
    closeNewGameInterface() {
        this.showNewGameInterface = false;
    },
    startGame() {
        this.showNewGameInterface = false;
        this.gameInProgress = true;
        this.turnIndex = 0;
    },

    addPlayer({ name }) {
      this.players = Finskore.addPlayer({name, players: this.players});
    },

    runShuffleOrder(action) {
        action = action || 'start';

        if(action === 'start') {
            this.shufflerInterval = setInterval(this.shuffleOrder, 150);
            return;
        }

        //Stop shuffling
        this.shuffleCount = 0;
        clearInterval(this.shufflerInterval);
    },

    shuffleOrder() {
        if(this.players.length < 2) {
            return;
        }

        const reducer = (accumulator, current) => accumulator + current.id;
        const prevOrder = this.players.reduce(reducer, '');

        while(this.players.reduce(reducer, '') === prevOrder) {
            this.shuffleCount++;
            this.players.sort( function(a,b) {
                    return (Math.random() < 0.5) ? -1 : 1;
            });
        }

        if(this.shuffleCount >= 6) {
            this.runShuffleOrder('stop');
        }
    },

    deletePlayer(playerId) {
      const selectedPlayer = this.players.find((player) => (player.id === playerId));
      const selectedPlayerIndex = this.players.indexOf(selectedPlayer)

      if(! confirm('Remove ' + selectedPlayer.name + ' from the game?')) {
          return;
      }

      this.players.splice(selectedPlayerIndex, 1);
      this.showScoreModal = false;
    },

    clearFlashMessage() {
        this.flashMessage = '';
    },

    //@var index player index
    handlePlayerSelectedFromLeaderboard(player) {
        this.selectedPlayer = player;
        this.setupGame = false;
        this.showScoreModal = true;
    },

    updateHistory({ turnIndex, newScore }) {
        /*
        turnIndex is from opposite direction to the turn history in the player's timeline.
        Flip the index to refer to correct position in source array, otherwise we're updating the wrong score
        */
        turnIndex = this.selectedPlayer.turns.length-turnIndex-1

        this.selectedPlayer.turns[turnIndex] = newScore

        const index = this.selectedPlayerIndex
        const { turns } = this.players[index]

        turns[turnIndex] = newScore

        /**
        * Figure out why $watch doesn't pay attention to this change.
        */
        Object.assign(this.players[index], { turns })

        /**
        * HACK: Just manually update the player score.
        * (acts to clear computed, to trigger recalculation) 
        */
        let newTotal = this.selectedPlayer.turns.reduce((sum, turn) => { //not DRY :(
            let subtotal = sum + turn;
            return subtotal > this.playToScore ? this.resetTo : subtotal;
        }, 0);

        this.selectedPlayer.score = newTotal;
        this.players[index].score = newTotal;

        //strikes don't update :(
        this.updatePositions();

        //Close modal, flash message
        this.showScoreModal = false;
        this.flashMessage = 'Score Updated';
        setTimeout(this.clearFlashMessage, 2000);
    },

    saveScore({ score, playerId }) {
        if(typeof score === 'undefined') {
            return;
        }
        const selectedPlayer = this.players.find((player) => (player.id === playerId));

        let index = this.players.indexOf(selectedPlayer);

        this.gameInProgress = true;
        this.showScoreModal = false;

        //Swing and a miss
        if(score === 0) {
            selectedPlayer.strikes++;
        } else {
            selectedPlayer.strikes = 0;
        }

        selectedPlayer.turns.push(score);
        selectedPlayer.score += score;

        //Too many points. Congratulations, you played yourself
        if(selectedPlayer.score > this.playToScore) {
            selectedPlayer.theyBlewIt = true;
            selectedPlayer.score = this.resetTo;
        } else {
            selectedPlayer.theyBlewIt = false;
        }

        //Copy score for sorting
        this.updatePositions(index, selectedPlayer.score);

        //Declare winner
        if(selectedPlayer.score === this.playToScore) {
            this.winner = selectedPlayer.name;
            return;
        }

        this.nextTurn();
    },

    // Update players position after each turn
    // bug: won't set a new leader if the current one strikes out
    updatePositions() {

        let scores = [];

        this.players.forEach( (player, index) => {
            scores.push({
                index: index,
                score: player.score,
                struckout: Finskore.hasStruckOut(player)
            });
        });

        scores.sort(function(a,b) {

            if( (!a.struckout && !b.struckout) ||
                (a.struckout && b.struckout) ) {

                return (a.score < b.score) ? 1 : -1;
            }

            if(a.struckout) {
                return 1;
            } else {
                return -1;
            }

            throw new Error('Your sorting logic is terrible. Just really bad mate.');
        });

        let prevScore = 0;
        let prevRankingPosition = 0;

        scores.forEach( (obj, index) => {
            
            if( Finskore.hasStruckOut(this.players[obj.index]) ) {
                this.players[obj.index].position = this.players.length;
            } else {

                //Tied with previous score, share their ranking position (there can be 3+ way ties)
                if(obj.score === prevScore) {
                    this.players[obj.index].position = prevRankingPosition;
                } else {
                    this.players[obj.index].position = index+1;
                    prevRankingPosition = index+1;
                }
            }
            
            prevScore = obj.score;
        });
    },

    nextTurn() {

        // todo FIX BUG -- if all players struck out goes to max call stack size (i.e. infinite loop)
        // matters slightly more because you can now retrospectively change a historical turn to a strike. Still edge case

        if(this.whoseTurn >= this.players.length-1) {
            this.whoseTurn = 0;
        } else {
            this.whoseTurn++;
        }

        //Skip a struck out player
        if( Finskore.hasStruckOut(this.players[this.whoseTurn]) ) {
            this.nextTurn();
        }
    },

    resetGame() {
        if(!confirm('Clear EVERYTHING and start a new game?')) {
            return;
        }
        this.players = [];
        this.scores = [];
        this.winner  = '';
        this.gameInProgress = false;
    },

    resetScores() {
        if(!confirm('Start a new game with same players?')) {
            return;
        }
        for(let i=0; i<this.players.length; i++) {
            this.players[i].score    = 0;
            this.players[i].strikes  = 0;
            this.players[i].position = 1;
            this.players[i].theyBlewIt = false;
            this.players[i].turns = [];
        }
        this.whoseTurn = 0;
        this.scores = [];
        this.gameInProgress = false;
        this.winner = '';
    },

    //Stub. todo: integrate with strike count, position tracking
    //This calculates score dynamically from turns, but doesn't update those things
    showScore(turns) {
        return turns.reduce((a, b) => a + b, 0);
    },

    setTheme(theme) {
        if( ['default', 'hot', 'white'].indexOf(theme) === -1 ) {
            return;
        }
    
        this.theme = theme;
        
        //Remove old theme- classes first
        document.body.classList.forEach( function(c) {
            if( c.substr(0, 6) === 'theme-' ) {
                document.body.classList.remove(c);
            }
        });

        document.body.classList.add('theme-' + theme);
        localStorage.setItem('theme', theme);
    },

    specialEventTheme() {
        let d = new Date();

        const isChristmas = (d) => d.getMonth() === 11 && (d.getDate() >= 10 && d.getDate() <= 30);

        if (isChristmas(d)) {
            document.body.classList.add('christmas');
            this.christmas = true;
        }
    }
  },

  computed: {
    resetTo() {
        return Math.ceil( this.playToScore/2 );
    },

    nameForScoring() {
      return (this.selectedPlayer.name.substr(-1) === 's')
        ? `${this.selectedPlayer.name}'`
        : `${this.selectedPlayer.name}'s`;
    },

    selectedPlayerIndex() {
      return this.players.indexOf(this.selectedPlayer)
    }
  },

  watch: {
    players: {
      handler(updatedPlayers) {
        //todo: check for 3 strikes in a row here to strike out player?
        // (so that it happens on history change too)
        updatedPlayers.forEach((player, index) => {

          //Back to 
          // if they bust over 50 this isn't recalcing. Why?
          this.players[index].score = player.turns.reduce(((sum, turn) => {
              let subtotal = sum + turn;
              return subtotal > this.playToScore ? this.resetTo : subtotal;
          }), 0);
        })
      },
      deep: true
    }
  },

  created() {
    //read state from local storage
    if(localStorage.getItem('finskoreState')) {
        let state = JSON.parse(localStorage.getItem('finskoreState'));

        if(typeof state.players !== 'undefined') {
            this.players = state.players;
        }
        this.playToScore = (!isNaN(state.playToScore) && state.playToScore > 0) ? state.playToScore : 50;
        this.whoseTurn = state.whoseTurn;
    }

    this.specialEventTheme();

    //Hacky -- update state with theme by sniffing DOM
    //Theme change event already handled
    let app = this;

    ['theme-white', 'theme-default'].forEach(function(t) {
        let theme = t.replace('theme-', '');

        if(document.body.classList.contains(t)) {
            app.setTheme(theme);
        }
    });
  },

  updated() {
    //Save state to localStorage in case of refresh
    let state = {
        playToScore: this.playToScore,
        players: this.players,
        whoseTurn: this.whoseTurn
    };

    localStorage.setItem('finskoreState', JSON.stringify(state));
  }
}
</script>

<style lang="scss">
* {box-sizing: border-box;}

header, footer, section {
    display: block;
}

body {
    padding: 0 1rem;
    margin: 0;
    font-family: sans-serif;
    background: #08476e;
    background: linear-gradient(220deg,#64bf64, #08476e);
    color: #fff;
    font-size: 1rem;
    min-height: 100vh; /* thanks @jaaprood */
}

/* Christmas Backgrounds */
body.christmas {
    background: url(img/xmas_green.jpg) no-repeat #0f2925;
    background-size: cover;
}
body.theme-hot.christmas {
    background: url(img/xmas_red.jpg) no-repeat #711c11;
    background-size: cover;
}

@media screen and (min-width: 1200px) {
    body.christmas {
        background-image: url(img/xmas_green_landscape.jpg);
    }
    body.theme-hot.christmas {
        background-image: url(img/xmas_red_landscape.jpg);
    }
}

#app, 
.container {
    margin: 0 auto;
    max-width: 768px;
}

#app {
    display: flex;
    flex-direction: column;
    padding: 2rem 0;
    min-height: 88vh;
    position: relative;
}

#app > main {
    flex-grow: 1;
}

.center {text-align: center;}
.right {text-align: right;}
.top-space {margin-top: 4rem;}

header.container {margin-bottom: 2rem;}
header h1 {margin: 0;}

section.winner {
    padding: 1rem;
    text-align: center;
    background: #1d1d1d;
}

.theme-white section.winner {
    background: #2799b7;
    color: #cff9ec;
}

form {
    background: rgba(12, 58, 80, 0.96);
    padding: 2rem;
    padding-bottom: 1px;
    z-index: 5;
}

form button {
    width: 8rem;
    border-radius: 3px;
}

form button.auto {
    width: auto;
}

.theme-white form {
    background: #92dec7;
}

.theme-white form button {
    box-shadow: none !important;
}

form h2 {
    margin-top: 0;
    text-align: center;
}

label {
    display: block;
    margin-bottom: 0.3rem;
}

div.addPlayerContainer {
    display: flex;
    max-width: 30rem;
    margin: 0 auto;
    gap: 1rem;
}

.addPlayerContainer div:first-child {flex-grow: 1;}

.addPlayerContainer input[type=text] {
    width: 100%;
}

button {
    background: #1f5f58;
    border: 1px solid #75e679;
    color: #99ef9b;
    padding: 0.5rem;
    font-size: 0.9rem;
    margin: 0.6rem 0;
}

button.cancel {
    color: #a2e6a4;
    border-color: #46a248;
    background: rgb(12, 58, 80);
}

button.warning {
    margin-right: 1rem;
    background: #343038;
    border-color: #bf964a;
    color: #f19c87;
}

input[type=text],
input[type=number] {
    padding: 0.5rem;
    font-size: 1rem;
    border: none;
}

input[type=number] {
    margin-right: 0.5rem;
}

form.enterScore {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    max-width: 100%;
    height: 100%;
    padding: 2rem 1rem;
    text-align: center;
    overflow: auto;
}

.score-container {
    display: grid;
    grid-template-columns: 55% 45%;
}

/* Footer */
footer {
    font-size: 0.8rem;
    margin-top: 2rem;
}

footer a {color: #77c97c;}
footer a:visited {color: #6ebd73;}

footer a:hover {
    background: #6ebd73;
    color: #224241;
    text-decoration: none;
}

.theme-white footer a,
.theme-white footer a:visited {
    color: #3c7940;
}

.themeSwitcher {
    float: right;
    margin-bottom: 1rem;

    /*position: absolute;
    bottom: 0;
    right: 0; */
}
    .themeSwitcher > div {
        display: inline-block;
        width: 40px;
        height: 25px;
        cursor: pointer;
    }

    .themeSwitcher .white {background: #eee; margin-right: 8px;}
    .themeSwitcher .default {background: #23676b; margin-right: 8px;}
    .themeSwitcher .hot {background: #eabd2e;}

    .theme-white .themeSwitcher .white {background: #fff;}
    
/* THEME - HOT */
body.theme-hot {
    background: linear-gradient(110deg,#efb024,#dc7626);
}

/* THEME - WHITE for being outside y'know? */
body.theme-white {
    background: linear-gradient(110deg, #fff, #ddd);
    color: #333;
}

.theme-hot footer a,
.theme-hot footer a:visited {
    color: #3c3c3c;
}
.theme-hot footer a:hover {
    background: #d24d15;
    color: #fff;
}

.christmas.theme-hot footer a,
.christmas.theme-hot footer a:visited {
    color: #f79657;
}

.theme-hot button {
    background: #ea5c11;
    border: 1px solid #ffecb6;
    color: #fff;
}

.theme-hot button.warning {
    background: #343038;
    border-color: #ff5722;
}

.theme-hot div.score button {
    color: #fbfafb;
    background: #e06b1f;
}

.theme-hot form {
    background: rgba(64, 31, 54, 0.96);
}

.theme-hot button.cancel {
    color: #e2a6a6;
    border-color: #8e5b75;
    background: rgb(105, 59, 83);
}

.theme-white button {
    background: #3d5894;
    color: #eef4f5;
    box-shadow: 3px 3px 0px 0px rgb(164, 201, 218);
    border: none;
}

.theme-white button.cancel {
    background: #38798a;
    box-shadow: 3px 3px 0px 0px rgba(0,0,0,0.15);
}

.theme-white button.warning {
    background: #e86613;
    box-shadow: 3px 3px 0px 0px rgba(134, 61, 49, 0.96);
    border: none;
    color: #fff;
}


/* Leaderboard */
.theme-hot section.leaderboard {
    color: #0a2c3c;
}
.christmas.theme-hot section.leaderboard {
    color: #fff;
    background: #4e1009c4;
}

.theme-hot section.leaderboard > div {
    border-bottom: 1px solid #efad26;
}
.christmas.theme-hot section.leaderboard > div {
    border-color: #a24f22;
}

.theme-white section.leaderboard {
    background: #fff !important;
}


.theme-hot .player.winning .pos {
    color: #f7d182;
}
.christmas.theme-hot .player.winning .pos {
    color: #eae8d6;
    background: #8a271a;
}
.theme-white .player.winning .pos {
    background: #38798a;
    color: #fff;
    font-weight: bold;
}


.theme-hot .player.myturn {
    background: #f7a448;
}
.christmas.theme-hot .player.myturn {
    background: #291610;
}
.theme-white .player.myturn {
    background: #92dec7;
}

.theme-hot .struckout {
    color: #924f34;
}

.theme-hot .history .line {
    background: #311d28;
}
.theme-hot .history .turn {
    background: #150e12;
    color: #de7a26;
}

.theme-white .history .turn {
    background: #fff;
    color: #111;
}
.theme-white .history .line {
    background: #fff;
}
.theme-white .history .turn.editing {
    background: #353535;
    background: radial-gradient(#7d7d7d, #353535);
    color: #c9f5e7;
}
</style>
