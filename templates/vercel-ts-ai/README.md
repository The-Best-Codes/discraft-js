# Discraft Vercel + TypeScript + AI Template

### **Check out the [Vercel Deployment Guide](https://dev.to/best_codes/make-a-free-ai-chatbot-with-discord-vercel-373l) for a more detailed, step-by-step guide.**

Let's get started creating a serverless Discord bot with Discraft and Vercel!
This template leverages TypeScript and Google AI for enhanced functionality.

**Note:** If you came here after running `discraft init` with the Vercel template, you can skip to the 'Configuring Google AI' section.

## Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/en/download/) (preferably version 18.x or higher)
- [Vercel CLI](https://vercel.com/cli)
- [Discraft CLI](https://github.com/The-Best-Codes/discraft-js)

## Getting Started

First, create a new directory for your project and navigate to it:

```bash
mkdir my-discraft-project
cd my-discraft-project
```

Now, initialize a new Discraft project, choosing the Vercel template:

```bash
discraft init
? Select a template:
  TypeScript
  JavaScript
❯ Vercel + TypeScript + Google AI
```

This will create a new project with a structure something like this:

```
my-discraft-project/
├── commands/
│   ├── chat.ts
│   └── ping.ts
├── public/
│   └── index.html
├── scripts/
│   └── register.ts
├── utils/
│   ├── logger.ts
│   └── types.ts
├── .env.example
├── .gitignore
├── .vercelignore
├── index.ts
├── package.json
├── README.md
├── tsconfig.json
└── vercel.json
```

## Configuring Google AI

This template utilizes the Google AI API for enhanced bot interactions. You'll need to create a Google AI project and obtain an API key. Here's how to configure it:

1. **Obtain API Key:** Visit the [Google AI Studio](https://aistudio.google.com/app/apikey) and obtain an API key.
2. **Select a Model:** Choose a suitable Google AI model. A good starting point is `gemini-2.0-flash-exp`, as it is currently free, but other models may be appropriate for your needs. You can find available models [here](https://ai.google.dev/models).
3. **Environment Variables:** The project relies on several environment variables to function correctly. You will need to set these in your `.env` file locally and in the Vercel project settings.
   - Create a `.env` file in your project's root directory.
   - Copy the contents of the `.env.example` file, filling in the values with your Discord and Google AI credentials.

Here's what the `.env.example` looks like:

```example
# You will need to add these secrets to the 'Environment Variables' section of your Vercel project
# https://vercel.com/docs/projects/environment-variables

# From `General Information > Public Key` | https://discord.com/developers/applications
DISCORD_PUBLIC_KEY=''
# From `General Information > App ID` | https://discord.com/developers/applications
DISCORD_APP_ID=''
# From `Bot > Token` | https://discord.com/developers/applications
DISCORD_TOKEN=''

# From `Get API Key` | https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY=''
# From the Google model list
GOOGLE_AI_MODEL='gemini-2.0-flash-exp'
```

**Important:** _Do not commit the `.env` file to your repository._ It should be added to your `.gitignore` file. This is already done for you in the template.

## Deploying to Vercel

1. **Create a Vercel Project:** If you haven't already, create a new project in your Vercel dashboard.
2. **Set Environment Variables:** In your Vercel project settings, go to "Environment Variables" and add all the variables you configured in your `.env`. You can find the project settings [here](https://vercel.com/dashboard).
3. **Run a Discraft Build**: In your project directory, run `npm run build` or `discraft vercel build` to create the API routes and files for your bot.
4. **Deploy:** You can deploy your bot to Vercel by running `npm run deploy` in your project directory.

## Discord Bot Setup

### Create a Discord Application

1. **Create a Discord Application:** Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. **Add a Bot User:** Add a bot user to your application.
3. **Invite the Bot:** Use the 'OAuth2 > URL Generator' section to create an invite link and add your bot to a server. Select the `applications.commands` scope and send this link to a discord server you own so you can see your bot in action.

### Change the Bot's Interactions Endpoint URL

1. **Go to the Bot's Application Page:** Go to the [Discord Developer Portal](https://discord.com/developers/applications) and select your bot's application.
2. **Go to the General Information Tab.**
3. **Set the Interactions Endpoint URL:** In the Interactions Endpoint URL field, enter the URL of your bot's API endpoint. This should be the URL of your Vercel deployment, followed by `/api`.

## Example Commands

This template comes with a couple of example commands:

- **`/ping`**: Responds with "Pong!".
- **`/chat <prompt>`**: Uses Google AI to respond to the given prompt.

## Get Help & See Demos

Need some assistance or want to see the bot in action? Join our Discord community!
[Discraft Support Discord](https://discord.gg/86qMjn4RHQ)

## Contribute

If you have ideas for the bot, or find any issues, you can create a pull request or issue on our github here:
https://github.com/The-Best-Codes/discraft-js
