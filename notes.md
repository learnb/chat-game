## Publish spacetime server module

From project root dir:
```bash
spacetime publish --project-path server chat-game-dev
```


## Build Client Module Bindings

run from `server` dir:
```bash
spacetime generate --lang typescript --out-dir ../client/tsclient/src/module_bindings --project-path ./
```


## Build

```bash
npm run build
```

(older)
```bash
npx tsc
```

creates a `dist` dir containing the transpiled JS files based on `tsconfig.json`.


## Run

Run JS using Node

```bash
node dist/index.js
```

