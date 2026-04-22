# AI-Rider Desktop App Roadmap

## Goal

Turn the current local Web studio into a stable desktop app for AI video production:

- Single-shot first/last-frame video generation
- Multi-shot batch generation with transition clips
- Local project folders and automatic file organization
- Persistent task history
- Smooth video preview
- GitHub-friendly open-source packaging

## Recommended Stack

- Desktop shell: Electron
- UI: React + Vite
- Local database: SQLite
- Background work: Node worker threads or child processes
- Video processing: ffmpeg / ffprobe
- Packaging: electron-builder

## Migration Steps

1. Keep the existing Web studio as the functional baseline.
2. Move Volcengine API, polling, downloading, and ffmpeg logic into app service modules.
3. Replace `settings.json` and `jobs.json` with SQLite.
4. Add a real background task queue for create, poll, download, and post-process jobs.
5. Rebuild the UI as Electron pages while preserving current workflows.
6. Add GitHub Actions for macOS builds first, then Windows if needed.

## First Desktop Milestone

- App launches without manually running `node server.js`
- API Key and settings persist locally
- Existing single-shot generation works
- Existing multi-shot generation works
- Videos download to selected project folder
- Task history survives app restart
