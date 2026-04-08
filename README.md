# EliteA UI

React UI for the EliteA Hub. Provides a prompt library and conversational interface to interact with various
LLMs.

## Features

- Persisted Agents Studi
- Chat interface for conversations
- Integration with EliteA API for AI processing

## Stack

- [React](https://reactjs.org/) - Frontend framework
- [Redux Toolkit (RTK)](https://redux-toolkit.js.org/rtk-query/overview) - State management
- [MUI (Material UI)](https://mui.com/material-ui/getting-started/) - UI styling and components
- [React router](https://reactrouter.com/en/main/router-components/browser-router) - Routing and navigation
- [EliteA Hub API](https://www.postman.com/projectelitea/workspace/elitea-api-public) - Backend API for AI

## Getting Started

1. Install dependencies `npm install`
2. create `.env` file with following variables:

- VITE_SERVER_URL=/api/v2
- VITE_DEV_TOKEN=**your_personal_token**
- VITE_BASE_URI=elitea_ui
- VITE_DEV_SERVER=https://dev.elitea.ai
- VITE_PUBLIC_PROJECT_ID=**public_project_id**
- VITE_SOCKET_PATH=/main/socket.io/
- VITE_SOCKET_SERVER=https://dev.elitea.ai

3. run dev server `npm run dev`

Contributing Pull requests are welcome! Feel free to open issues to discuss improvements or bugs.

License Apache 2.0
