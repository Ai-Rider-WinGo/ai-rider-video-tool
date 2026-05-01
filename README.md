# AI-Rider Video | AI Video Workbench

[中文](./README.zh-CN.md) | **English**

AI-Rider Video is a desktop-first AI video workbench evolving from the original "first frame + last frame + prompt" workflow into a template-driven, multi-model creation product.

Current stable version: `2.3.1`

## Documentation

- [Version History](./docs/version-history.en.md)
- [2.0.0 PRD Draft](./docs/versions/2.0.0.md)
- [1.x Release Archive](./docs/versions/1.x.en.md)
- [1.1.3 Release Notes](./docs/releases/1.1.3.en.md)
- [Desktop Environment Setup](./docs/desktop-environment.en.md)
- [Desktop App Roadmap](./docs/desktop-app-roadmap.en.md)
- [Desktop Build Automation](./docs/desktop-builds.md)

## 2.x Overview

The `2.x` line is the first real product-system upgrade for AI-Rider Video.

- `2.0.x`: model adaptation, provider abstraction, activation-code groundwork
- `2.1.x`: product-expression and workbench UX upgrades
- `2.2.x`: workspace expansion, reusable assets, and model/template entry pages
- `2.3.x`: commercialization and ecosystem integration

The current `2.3.1` build follows the `2.3.0` licensing rollout by completing the desktop packaging and release automation path:

- keeps the `2.3.0` activation and licensing flow
- adds Windows packaging configuration and icon assets
- adds GitHub Actions automation for `mac + win` builds
- fixes CI dependency installation conflicts for build runners

## Features

- Template-driven video generation workflows
- First + last frame generation
- First-frame generation
- Text-to-video generation
- Experimental video extension entry
- Multi-model support with a registry-based capability layer
- Local cost estimation based on token usage
- Advanced panels for API endpoints, JSON passthrough, and debugging
- Backend job creation, polling, result inspection, and local downloads
- First-launch activation onboarding
- License validation and remaining-use control
- License generation, freeze, revoke, and device reset tooling

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
