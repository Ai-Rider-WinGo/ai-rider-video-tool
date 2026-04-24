# AI-Rider Desktop Environment Setup

[中文](./desktop-environment.md) | **English**

AI-Rider is being migrated from a local web console into an Electron desktop app.

## Required tools

- Node.js 20 LTS or newer
- npm 10 or newer
- Git
- ffmpeg and ffprobe

Install the media tools on macOS with Homebrew:

```bash
brew install ffmpeg
```

## Install project dependencies

```bash
cd '/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端'
npm run setup:desktop
```

This command installs project dependencies and runs the environment check.

## Check the environment manually

```bash
npm run check:env
```

## Start the web service

```bash
npm run start:web
```

Open:

```text
http://127.0.0.1:3100
```

## Start the desktop shell

```bash
npm run start:desktop
```

The desktop app starts the local service automatically and opens it in an Electron window.

## Build a macOS package

```bash
npm run build:mac
```

Build output goes to `release/`.
