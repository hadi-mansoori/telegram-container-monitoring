# Mansoori Telegram Monitoring

## Overview

Mansoori Telegram Monitoring is a lightweight Bash-based tool for remotely managing and monitoring Docker containers through a Telegram bot.

## What It Does

- View container logs and receive them as `.log` files.
- Restart Docker containers directly from Telegram.
- Manage containers remotely without SSH or terminal access.
- Run continuously in the background using `tmux`, `screen`, or systemd.

## How It Works

The script runs on a host machine with Docker installed and continuously listens for Telegram requests. When a user sends `/list`, the bot displays an inline menu with **Logs** and **Restart** options.

After selecting an action, the user chooses a container, and the script executes the corresponding Docker operation. Logs are returned as a `.log` file.

## Use Case

The project is designed for server administrators, developers, and DevOps teams who need a simple way to manage Docker containers remotely from Telegram.

## Requirements

- Bash
- Docker
- curl
- jq
- Telegram Bot Token
- Telegram Chat ID

## Configuration

The main configuration values are:

- `BOT_TOKEN` — Telegram bot token obtained from BotFather.
- `CHAT_ID` — Numeric Telegram chat or group ID.
- `DOCKER` — Docker executable path, defaulting to `/usr/bin/docker`.
- `TEST_MODE` — Optional testing mode that prevents the bot from sending messages.

Credentials and chat identifiers should be stored securely.

## Usage

Make the script executable and run it:

```bash
chmod +x telegram-container-monitoring.sh
./telegram-container-monitoring.sh
```

For persistent execution, the project can be configured as a systemd service so it starts automatically with the server and can restart after failures.

## Telegram Interface

The primary command is:

```text
/list
```

It opens the main container-management menu with:

- **Logs** — Select a container and retrieve its latest logs.
- **Restart** — Select a container and restart it.

## Summary

**Mansoori Telegram Monitoring** provides a simple Telegram-based interface for Docker container management, making common administrative tasks accessible remotely without requiring direct terminal access.
