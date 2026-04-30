# AI-Rider Version History

[中文](./version-history.md) | **English**

## 1.x Series

The `1.x` series marks the phase where AI-Rider evolved from a local utility into a structured desktop product prototype.

### 1.0.0

- Shipped the initial local web workflow for first-frame and last-frame video generation
- Defined the product direction around the "first frame + last frame + prompt" workflow
- Established the base create, poll, and download flow

### 1.0.1

- Added desktop environment setup
- Installed Electron and packaging dependencies
- Added desktop entrypoint, environment checks, and launch commands

### 1.0.2

- Finalized product branding
- Confirmed the name `AI-Rider | First-to-Last Frame Video Tool`
- Added logo, desktop icon, window title, and page title

### 1.1.0

- Delivered the first major UX upgrade
- Set minimum duration to `4 seconds`
- Set default `FPS` to `30`
- Added language switching
- Added preset prompt helpers
- Moved extra parameters into a collapsible section

### 1.1.1

- Entered the compact header and top-bar optimization cycle
- Added compact header mode
- Added quick access to downloads and task counters
- Merged theme and language controls into the top toolbar

### 1.1.2

- Completed H5 responsive adaptation
- Fixed mobile header height issues
- Improved tooltip overflow, wrapping, and boundary handling
- Refined toggles and config help interactions

### 1.1.3

- Wrapped up the 1.x release preparation
- Produced launch copy and poster assets
- Added structured version documentation
- Defined it as the final stable state before `2.0.0`

Detailed archive:

- [1.x Release Archive](./versions/1.x.en.md)

## 2.x Series

The `2.x` line marks the shift from a single desktop tool to a structured AI video product system.

### 2.0.0

- Entered formal product-planning phase
- Defined the version position: multi-model, multi-API, activation-ready, web-compatible product direction
- Completed the first `2.0.0` PRD draft
- Established the staged `2.x` versioning approach

### 2.0.1

- Model adaptation foundation
- Introduced the model registry and capability mapping direction
- Started integrating Seedance 2.0 into a shared product layer

### 2.1.0

- Product workbench upgrade
- Reorganized the UI around templates, creation flow, task panel, and advanced sections
- Shifted the product expression from a parameter-heavy tool to a video workbench
- Established the current `2.1.0` stable desktop state

### 2.2.0

- Workspace expansion release
- Added a clickable template center with one-click apply back to the main studio
- Added a local asset panel for uploading, previewing, and reusing image/video materials
- Added a model market view for capability-based model switching
- Unified repository and runtime versioning under `2.2.0`

### 2.3.0

- First license and activation rollout
- Added a first-launch activation gate before entering the workbench
- Added the WeChat-led path for trial and formal activation codes
- Added tiered activation codes with `5 / 50 / 100 / 1000` uses
- Added local activation, status, and consume flows in the desktop service
- Added a license admin CLI for generation and management
- Unified repository and runtime versioning under `2.3.0`

Detailed archive:

- [2.0.0 PRD Draft](./versions/2.0.0.md)
- [2.3.0 License System Plan](./versions/2.3.0-license-system.md)
- [2.3.0 License Technical Design](./versions/2.3.0-license-tech.md)
