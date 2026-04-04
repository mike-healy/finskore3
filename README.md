DOING

- Add players
- Start the game (can no longer add players)
- Enter a score (appends to the players array)

# Finskore3

## Next steps
- Push score to array, not just incrementing count
- Reducer to calculate current score from history (keeping in mind going over limit)
- Move type definitions somewhere central. Could probably be exactly like the React projects?

This template should help get you started developing with Vue 3 in Vite.

## Tailwind
There seems to be a HMR bug with Vite 7 and picking up new Tailwind styles.
You'll need to refresh for new classes, though HMR works for JS changes.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```
