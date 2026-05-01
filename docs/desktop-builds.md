# AI-Rider 桌面端自动打包说明

## 当前能力

仓库已经接入 GitHub Actions 自动打包桌面安装包：

- `macOS`：输出 `.dmg` 与 `.zip`
- `Windows`：输出 `NSIS .exe` 安装包

工作流文件：

- [`.github/workflows/build-desktop.yml`](/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端/.github/workflows/build-desktop.yml)

## 触发方式

支持两种触发方式：

1. 手动触发
   - GitHub -> `Actions` -> `build-desktop` -> `Run workflow`

2. 推送版本标签
   - 例如：`v2.3.0`

## 产物位置

### GitHub Actions

每次构建完成后，安装包会作为 workflow artifact 上传：

- `ai-rider-mac-<tag>`
- `ai-rider-win-<tag>`

### 本地打包

本地产物目录：

- `release/`

## 本地命令

### 打包 mac

```bash
npm run build:mac
```

### 打包 win

```bash
npm run build:win
```

### 同时打包

```bash
npm run build:desktop
```

## 说明

- 当前 mac 本地已验证可直接出包
- Windows 更推荐通过 GitHub Actions 的 Windows runner 构建
- `2.3.0` 已补齐 Windows 图标与打包配置
