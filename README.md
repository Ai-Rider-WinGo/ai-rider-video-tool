# AI-Rider | First-to-Last Frame Video Tool

[中文](./README.zh-CN.md) | **English**

AI-Rider Video Tool is a desktop-first video generation tool built around the "first frame + last frame + prompt" workflow.

Current stable version: `1.1.3`

## Documentation

- [Version History](./docs/version-history.en.md)
- [1.x Release Archive](./docs/versions/1.x.en.md)
- [Desktop Environment Setup](./docs/desktop-environment.en.md)
- [Desktop App Roadmap](./docs/desktop-app-roadmap.en.md)

## Features

- Configure API key, model, task creation endpoint, and polling endpoint template
- Configure aspect ratio, resolution, duration, FPS, watermark, and seed
- Pass through extra JSON parameters for account-specific or model-specific fields
- Upload first frame and last frame in the UI
- Create jobs on the backend and poll automatically
- View task status, task ID, progress, and raw responses
- Download generated videos to local `downloads/`
- Generate download filenames from prompt content

## Start

### Install desktop dependencies

```bash
cd '/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端'
npm run setup:desktop
npm run check:env
```

Required local tools:

- Node.js 20 LTS or newer
- npm 10 or newer
- Git
- ffmpeg / ffprobe

Install media tools on macOS with Homebrew:

```bash
brew install ffmpeg
```

### Start the desktop app

```bash
npm run start:desktop
```

### Start the web app

```bash
cd '/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端'
npm run start:web
```

Open:

```text
http://127.0.0.1:3100
```

## Default directories

- UI files: `public/`
- Downloaded videos: `downloads/`

## Notes

Default endpoints are prefilled as:

- Create: `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks`
- Query: `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{task_id}`

If your account uses different field names or endpoint templates, update them in the UI without changing code.

Example for extra JSON parameters:

```json
{
  "return_last_frame": true
}
```

The current implementation sends the first frame and the last frame as two reference images. Depending on the exact Volcengine capability enabled on your account, the last frame may work as a hard ending constraint or as an additional reference image.
