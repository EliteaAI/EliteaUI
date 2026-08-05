# EliteaUI

React frontend for the Elitea AI platform. Provides a prompt library, agent studio, and conversational
interface for interacting with LLMs.

## Stack

- [React 18](https://reactjs.org/) — UI framework
- [Redux Toolkit (RTK)](https://redux-toolkit.js.org/) — state management & API layer
- [MUI 7](https://mui.com/material-ui/) — component library & styling
- [React Router 7](https://reactrouter.com/) — routing
- [Vite 6](https://vitejs.dev/) — build tool & dev server
- [Playwright](https://playwright.dev/) — E2E testing
- [Vitest](https://vitest.dev/) — unit testing

## Getting Started

### Prerequisites

- Node.js (LTS)
- npm

### Setup

1. Clone the repository and install dependencies:

```bash
git clone git@github.com:EliteaAI/EliteaUI.git
cd EliteaUI
npm install
```

2. Create a `.env` file from the example:

```bash
cp .env.example .env
```

Then set `VITE_DEV_TOKEN` to a valid, non-expired token from the dev environment.

| Variable                  | Description                          |
| ------------------------- | ------------------------------------ |
| `VITE_SERVER_URL`         | API base path                        |
| `VITE_BASE_URI`           | App base URI                         |
| `VITE_DEV_SERVER`         | Backend server URL                   |
| `VITE_DEV_TOKEN`          | Auth token (personal, do not commit) |
| `VITE_PUBLIC_PROJECT_ID`  | Default public project ID            |
| `VITE_SOCKET_SERVER`      | WebSocket server URL                 |
| `VITE_SOCKET_PATH`        | WebSocket path                       |
| `VITE_USE_NEW_IMPORT`     | Enable new import flow               |
| `VITE_USE_COLLECTION`     | Enable collections                   |
| `VITE_GAID`               | Google Analytics ID (optional)       |
| `VITE_ELITEA_ASSISTANT`   | Enable Elitea assistant              |
| `VITE_MAINTENANCE_BANNER` | Show maintenance banner              |

3. Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`. Changes auto-refresh via HMR.

## Available Commands

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm install`               | Install dependencies                     |
| `npm run dev`               | Start dev server (default mode)          |
| `npm run dev -- --mode=dev` | Start dev server against DEV backend     |
| `npm run build`             | Production build                         |
| `npm run build:watch`       | Build with watch mode                    |
| `npm run lint`              | Run ESLint                               |
| `npm run format`            | Run Prettier                             |
| `npm run test`              | Run Playwright E2E tests                 |
| `npm run test:dev`          | Run tests with Playwright UI             |
| `npm run test:debug`        | Debug tests with Playwright inspector    |
| `npm run test:install`      | Install Playwright browsers (first time) |

## Git Workflow

1. Create a branch from `main`:

```bash
git checkout -b fix/EL-1234/short-description
```

Branch naming: `fix/`, `feat/`, or `hotfix/` prefix, followed by the ticket number and a short description.

2. Make changes, test locally, then commit:

```bash
git add <files>
git commit -m "fix: [EL-1234] Description of the change"
```

3. Push and open a PR:

```bash
git push -u origin fix/EL-1234/short-description
```

4. Assign a frontend developer for review. Once approved, changes are merged and deployed to DEV.

## Testing Locally

Before pushing, verify:

- The modified feature works in all expected scenarios
- No new errors in the browser console (F12 → Console)
- The UI renders correctly and is responsive
- Related features still work (regression check)
- API requests and responses are handled properly

## Deploying to Docker Environment

When the UI is served from Docker, changes require a rebuild:

```bash
npm run build
rm -rf ../centry/pylon_main/plugins/elitea_core/static/ui/dist/*
cp -r dist/* ../centry/pylon_main/plugins/elitea_core/static/ui/dist/
```

Then hard-refresh the browser (Ctrl+Shift+R / Cmd+Shift+R). No container restart needed.

## Contributing

Pull requests are welcome. Open issues to discuss improvements or bugs.

## License

Apache 2.0
