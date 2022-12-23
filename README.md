# Finskore 3

## Version 3 – Updated tooling
This repo will replace Finksore, and is build with Vue 3, Vite and more.

## Finksa / Klop / Molkky -- The Greatest Game
![Finskore Banner Graphic](https://www.finskore.com/img/banner.png)

Are you sick of have to remember numbers, and worse still add number together and subtract the sum of those numbers from 50 in your head, while you're just trying to enjoy throwing a stick at other sticks with numbers on them?
Of course you are. It's terrible.

Finskore is a simple client side app to do all that for you, as well as the name stuff, the whose turn is it stuff, and the how many strikes am I on stuff. All the boring stuff, leaving you free to focus on stick tossing.

-----------------------

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
