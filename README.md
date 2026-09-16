# repo-radar

An Electron application with React and TypeScript

[![CI](https://github.com/jonathanpperry/repo-radar/actions/workflows/ci.yml/badge.svg)](https://github.com/jonathanpperry/repo-radar/actions/workflows/ci.yml)

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Development Workflow

Repo Radar uses Electron with separate main-process and renderer code.

- Changes under `src/renderer/` usually appear through hot reload while `npm run dev` is running.
- Changes to Electron/main-process code under `src/main/`, such as repository scanning or Git integration, may require restarting the development server before the new behavior is reflected.
- Changes to shared types under `src/shared/` can affect both processes.

If a backend or Git-related change does not appear after saving, stop the development server and restart it:

```bash
Ctrl+C
npm run dev
```

When debugging a feature, verify whether the code runs in the renderer or Electron main process before assuming hot reload has picked up the change.
