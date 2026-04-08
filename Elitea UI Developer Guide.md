# Elitea UI Developer Guide

Welcome to the Elitea UI repository! This detailed guide will help you set up, modify, and contribute to the
Elitea UI project, even if you have no prior coding experience.

## Introduction

Elitea UI is a React-based user interface for Elitea, providing a prompt library and conversational interface
to interact with various Large Language Models (LLMs). This guide will walk you through the entire process of
setting up your development environment, making changes, and contributing your improvements back to the
project.

## Table of Contents

- [Elitea UI Developer Guide](#elitea-ui-developer-guide)
  - [Introduction](#introduction)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
    - [1. Check Node.js and NPM Installation](#1-check-nodejs-and-npm-installation)
    - [2. Check SSH Key Setup](#2-check-ssh-key-setup)
  - [Clone the Repository](#clone-the-repository)
    - [Creating a New Project in VSCode](#creating-a-new-project-in-vscode)
    - [Clone the Repository](#clone-the-repository-1)
  - [Setup Environment](#setup-environment)
    - [Install Dependencies](#install-dependencies)
  - [Run Local Server](#run-local-server)
  - [Using GitHub Copilot for Making Changes](#using-github-copilot-for-making-changes)
    - [Best Practices for Using Copilot:](#best-practices-for-using-copilot)
  - [Testing Changes Locally](#testing-changes-locally)
    - [Manual Testing Procedure](#manual-testing-procedure)
    - [Key Areas to Test](#key-areas-to-test)
    - [Testing Checklist](#testing-checklist)
  - [Commit and Push Changes](#commit-and-push-changes)
    - [Create a New Branch](#create-a-new-branch)
    - [Add and Commit Changes](#add-and-commit-changes)
    - [Push Changes to GitHub](#push-changes-to-github)
  - [Create a Merge Request](#create-a-merge-request)
  - [Appendix: Installing Node.js and NPM](#appendix-installing-nodejs-and-npm)
    - [For macOS:](#for-macos)
    - [For Windows:](#for-windows)
  - [Appendix: Setting up SSH Keys](#appendix-setting-up-ssh-keys)
    - [For macOS:](#for-macos-1)
    - [For Windows:](#for-windows-1)
  - [Need Help?](#need-help)

## Prerequisites

Before you begin, you need to ensure you have the necessary tools installed on your computer:

### 1. Check Node.js and NPM Installation

Node.js is a JavaScript runtime environment, and NPM (Node Package Manager) is used to install JavaScript
libraries.

To check if Node.js and NPM are installed:

1. Open Terminal (on macOS) or Command Prompt (on Windows)
2. Type the following commands and press Enter after each:

```
node -v
npm -v
```

If both commands display version numbers, you already have Node.js and NPM installed. If not, see the
[Appendix: Installing Node.js and NPM](#appendix-installing-nodejs-and-npm) section.

### 2. Check SSH Key Setup

SSH keys are used for secure communication with GitHub. To check if you have SSH keys set up:

1. Open Terminal (on macOS) or Git Bash (on Windows)
2. Type the following command and press Enter:

```
ls -al ~/.ssh
```

If you see files named `id_rsa` and `id_rsa.pub` (or similar), you already have SSH keys. If not, see the
[Appendix: Setting up SSH Keys](#appendix-setting-up-ssh-keys) section.

## Clone the Repository

Cloning means creating a local copy of the repository on your computer.

### Creating a New Project in VSCode

1. Open Visual Studio Code (VSCode)
2. Click on "File" in the top menu
3. Select "Open Folder"
4. Choose or create a folder where you want to store the project
5. Click "Open"

### Clone the Repository

1. In VSCode, open the Terminal by clicking on "Terminal" in the top menu and selecting "New Terminal"
2. In the terminal, navigate to your project folder if you aren't already there
3. Clone the repository using one of these commands:

**Using HTTPS (recommended for beginners):**

```
git clone https://github.com/ProjectEliteA/EliteAUI.git
```

**Using SSH (if you have SSH keys set up):**

```
git clone git@github.com:ProjectEliteA/EliteAUI.git
```

4. Wait for the cloning process to complete
5. After cloning, navigate into the project folder:

```
cd EliteAUI
```

## Setup Environment

Now you need to set up the environment configuration:

1. In the root folder of the cloned repository, create a new file named `.env.dev`
2. Open this file in VSCode or any text editor
3. Copy and paste the following content:

```
VITE_SERVER_URL=/api/v2
VITE_BASE_URI=/elitea_ui
VITE_DEV_SERVER=https://dev.elitea.ai
VITE_DEV_TOKEN=YOUR_ELITEA_TOKEN_FOR_DEV_ENV
VITE_DEV_TOKEN_WITHOUT_PERMISSION=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiMzMxNjkxOGItM2JjOS00ZTM3LTg5ZTktZTIwMDc0ZDhlNTQyIiwiZXhwaXJlcyI6bnVsbH0.ENVCJaa7gB9Q7Bed8WbkzIndT9_jORX4vXKUaJgjq-Al1X--tNTR8kr9Ro6q8lSS5OjxNwOBvnINlHGwCyeMww
OLD_VITE_DEV_SERVER=https://public.getcarrier.io
VITE_PUBLIC_PROJECT_ID=1
VITE_SOCKET_SERVER=wss://dev.elitea.ai
VITE_SOCKET_PATH=/socket.io/
VITE_USE_NEW_IMPORT=1
VITE_USE_COLLECTION=1
```

4. Replace `YOUR_ELITEA_TOKEN_FOR_DEV_ENV` with your actual Elitea token for the dev environment
   - This token should be non-expired and valid
   - You can obtain this token from your Elitea admin or by logging into the dev environment
5. Save the file

### Install Dependencies

Before running the project, you need to install all necessary dependencies:

1. In the terminal, make sure you're in the EliteAUI directory
2. Run the following command:

```
npm install
```

3. Wait for the installation to complete (this may take several minutes)

## Run Local Server

Now you're ready to run the project locally:

1. In the terminal, run the following command:

```
npm run dev -- --mode=dev
```

2. Wait for the server to start. You'll see a message with a local URL, typically `http://localhost:5173/`
3. Click on the link or copy and paste it into your web browser
4. You should now see the Elitea UI running locally
5. Any changes you make to the code will automatically refresh in the browser
6. The backend will be connected to the DEV environment, as specified in the `.env.dev` file

## Using GitHub Copilot for Making Changes

GitHub Copilot is an AI-powered coding assistant that can help you make changes, even if you're not an
experienced developer:

1. If you have access to GitHub Copilot, make sure it's installed and activated in VSCode
2. Enable Agent Mode for better assistance
3. Choose recommended models like Claude Sonnet 3.7 or GPT-4.1 for optimal results
4. When making changes:
   - Clearly describe the issue you want to fix
   - Explain what improvements you want to make
   - Add the whole repo folder as context for better results
   - Follow the suggestions provided by the AI

### Best Practices for Using Copilot:

- Be specific and detailed about what you want to accomplish
- Provide error messages or screenshots if applicable
- Ask for explanations if you don't understand the changes
- Review all changes before committing them

## Testing Changes Locally

After making changes to the codebase, it's crucial to thoroughly test them before committing. This ensures
your changes work as intended and don't introduce new issues:

### Manual Testing Procedure

1. **Verify Your Changes Work as Expected**:
   - Test specifically the feature or bug fix you've implemented
   - Try different inputs and edge cases related to your changes
   - Make sure the UI looks correct and is responsive on different screen sizes

2. **Regression Testing**:
   - Test related functionality that might be affected by your changes
   - Navigate through the application to ensure everything still works correctly
   - Check that no new errors appear in the browser console (F12 → Console tab)

### Key Areas to Test

1. **Functionality Testing**:
   - Does the modified feature work correctly in all scenarios?
   - Are all user interactions (clicks, form submissions, etc.) handled properly?
   - Does the application handle errors gracefully?

2. **UI Testing**:
   - Do all elements display properly?
   - Is the UI responsive on different screen sizes?
   - Are there any visual glitches or alignment issues?

3. **Integration Testing**:
   - Do the changes work well with other parts of the application?
   - Is data being correctly passed between components?
   - Are API requests and responses handled properly?

### Testing Checklist

- [ ] The modified feature works as expected
- [ ] No console errors appear in the browser
- [ ] The UI is visually correct
- [ ] Related features still work properly
- [ ] Changes meet the requirements of the bug report or feature request

Taking the time to thoroughly test your changes locally will save time in the review process and ensure a
smoother integration of your code into the main project.

## Commit and Push Changes

After making and testing changes, you need to save them to GitHub:

### Create a New Branch

1. In the terminal, make sure you're in the EliteAUI directory
2. Create and switch to a new branch using:

```
git checkout -b fix/your-branch-name
```

Replace `your-branch-name` with a descriptive name, e.g., `fix/clear-all-alert+browser-tab-name-546`

### Add and Commit Changes

1. Add all your changes to staging:

```
git add .
```

2. Commit your changes with a descriptive message:

```
git commit -m "Fix for Bug 3012 making better Tab Titles"
```

Replace the message with an informative description of your changes

### Push Changes to GitHub

1. Push your branch to GitHub:

```
git push -u origin fix/your-branch-name
```

Replace `fix/your-branch-name` with your actual branch name

## Create a Merge Request

Now that your changes are on GitHub, create a Merge Request (also known as Pull Request):

1. Go to the [EliteAUI GitHub repository](https://github.com/ProjectEliteA/EliteAUI)
2. You should see a notification about your recently pushed branch; click on "Compare & pull request"
3. If you don't see this notification:
   - Click on the "Pull requests" tab
   - Click the green "New pull request" button
   - Select your branch from the dropdown menu
4. Fill in the details:
   - Provide a descriptive title
   - Add a detailed description of your changes
   - Mention any related issues or bugs by number (e.g., #546)
5. Click "Create pull request"
6. Assign the merge request to a Front-End Developer for review
7. Wait for feedback, and make any additional changes if requested
8. Once approved, the changes will be merged into the main branch and deployed to the DEV environment
9. Test your changes on the DEV environment to ensure everything works as expected

## Appendix: Installing Node.js and NPM

### For macOS:

1. **Using Homebrew (recommended)**:
   - Open Terminal
   - If you don't have Homebrew installed, install it with:
     ```
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
     ```
   - Install Node.js (which includes NPM) with:
     ```
     brew install node
     ```

2. **Using the Installer**:
   - Go to [Node.js website](https://nodejs.org/)
   - Download the LTS (Long Term Support) version for macOS
   - Open the downloaded file and follow the installation wizard
   - Follow the prompts to complete installation

### For Windows:

1. **Using the Installer**:
   - Go to [Node.js website](https://nodejs.org/)
   - Download the LTS (Long Term Support) version for Windows
   - Open the downloaded file and follow the installation wizard
   - Make sure to check the box that says "Automatically install the necessary tools..."
   - Follow the prompts to complete installation

2. **Verify Installation**:
   - Open Command Prompt
   - Type the following commands and press Enter after each:
     ```
     node -v
     npm -v
     ```
   - If you see version numbers, the installation was successful

## Appendix: Setting up SSH Keys

SSH keys provide a secure way to connect to GitHub without entering your password each time.

### For macOS:

1. **Generate SSH Key**:
   - Open Terminal
   - Run:
     ```
     ssh-keygen -t ed25519 -C "your_email@example.com"
     ```
     (Replace with your GitHub email address)
   - When prompted for a file location, press Enter to accept the default
   - When prompted for a passphrase, enter one if desired or press Enter twice for no passphrase
   - Your SSH key pair is now generated

2. **Add SSH Key to SSH Agent**:
   - Start the SSH agent:
     ```
     eval "$(ssh-agent -s)"
     ```
   - Add your key:
     ```
     ssh-add ~/.ssh/id_ed25519
     ```

3. **Add SSH Key to GitHub**:
   - Copy your public key to clipboard:
     ```
     pbcopy < ~/.ssh/id_ed25519.pub
     ```
   - Go to [GitHub SSH Settings](https://github.com/settings/ssh/new)
   - Log in if prompted
   - In the "Title" field, add a descriptive label (e.g., "MacBook Pro")
   - Paste the key in the "Key" field
   - Click "Add SSH key"

### For Windows:

1. **Generate SSH Key**:
   - Open Git Bash (install Git for Windows if you haven't already)
   - Run:
     ```
     ssh-keygen -t ed25519 -C "your_email@example.com"
     ```
     (Replace with your GitHub email address)
   - When prompted for a file location, press Enter to accept the default
   - When prompted for a passphrase, enter one if desired or press Enter twice for no passphrase
   - Your SSH key pair is now generated

2. **Add SSH Key to SSH Agent**:
   - Start the SSH agent:
     ```
     eval "$(ssh-agent -s)"
     ```
   - Add your key:
     ```
     ssh-add ~/.ssh/id_ed25519
     ```

3. **Add SSH Key to GitHub**:
   - Display your public key:
     ```
     cat ~/.ssh/id_ed25519.pub
     ```
   - Manually copy the entire output
   - Go to [GitHub SSH Settings](https://github.com/settings/ssh/new)
   - Log in if prompted
   - In the "Title" field, add a descriptive label (e.g., "Windows Laptop")
   - Paste the key in the "Key" field
   - Click "Add SSH key"

4. **Test Your Connection**:
   - In Git Bash, run:
     ```
     ssh -T git@github.com
     ```
   - Type "yes" if prompted
   - If you see a message like "Hi username! You've successfully authenticated...", your SSH key is set up
     correctly

---

## Need Help?

If you encounter any issues or have questions, please reach out to your team's technical lead or create an
issue on the GitHub repository.

Happy coding!
