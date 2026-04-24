# AI-Rider Desktop Environment Setup

AI-Rider｜首尾帧生成视频工具 is being migrated from a local Web console to an Electron desktop app.

## Required tools

- Node.js 20 LTS or newer
- npm 10 or newer
- Git
- ffmpeg and ffprobe

On macOS, install the media tools with Homebrew:

```bash
brew install ffmpeg
```

## Install project dependencies

```bash
cd '/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端'
npm run setup:desktop
```

This command uses a faster Electron mirror by default. If the mirror is not needed, plain `npm install` also works. Installation runs the environment check automatically.

## Check the environment manually

```bash
npm run check:env
```

## Start the existing Web service

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

## Build a macOS desktop package

```bash
npm run build:mac
```

Build output is written to `release/`.
