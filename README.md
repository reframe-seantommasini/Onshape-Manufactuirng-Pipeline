# FRC 6328 Manufacturing Pipeline

A right-panel OnShape integration for FRC 6328 (Mechanical Advantage) that lets students select parts directly in the Part Studio and submit manufacturing cards to Slack.

## Features
- Reads live part selection from OnShape Part Studio
- Submits cards to Slack with material, machine, quantity, finish, and more
- Session history tab to track submitted cards
- Demo mode for testing without credentials

## Setup
1. Get OnShape API keys from cad.onshape.com → My Account → API Keys
2. Create a Slack bot at api.slack.com/apps with `chat:write` scope
3. Register as a Right Panel extension at dev-portal.onshape.com
4. Set Action URL to: https://reframe-seantommasini.github.io/Slack-List-Onshape-Integration/
