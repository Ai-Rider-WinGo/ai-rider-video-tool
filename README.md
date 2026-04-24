# AI-Rider｜首尾帧生成视频工具

一个面向桌面端的首尾帧视频生成工具，用来做“首帧 + 尾帧 + 提示词”的火山引擎视频生成。

当前稳定版本：`1.1.3`

版本档案：

- [版本历史](/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端/docs/version-history.md)
- [1.x 版本档案](/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端/docs/versions/1.0.0.md)

## 功能

- 配置 API Key、模型、创建接口、查询接口模板
- 配置比例、分辨率、时长、FPS、水印、随机种子
- 支持额外 JSON 参数透传，方便兼容不同账号/模型字段
- 前端上传首帧和尾帧
- 后端创建任务并自动轮询
- 展示状态、任务 ID、进度、原始返回
- 成功后自动下载视频到本地 `downloads/`
- 下载文件名基于提示词内容生成

## 启动

### 桌面端环境安装

```bash
cd '/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端'
npm run setup:desktop
npm run check:env
```

需要本机已安装：

- Node.js 20 LTS 或更新版本
- npm 10 或更新版本
- Git
- ffmpeg / ffprobe

macOS 可用 Homebrew 安装视频工具：

```bash
brew install ffmpeg
```

详细说明见：`docs/desktop-environment.md`

### 启动桌面端

```bash
npm run start:desktop
```

### 启动 Web 版

```bash
cd '/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端'
npm run start:web
```

浏览器打开：

```text
http://127.0.0.1:3100
```

## 默认目录

- 页面：`/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端/public`
- 下载视频：`/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端/downloads`

## 说明

默认接口已预填为：

- 创建：`https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks`
- 查询：`https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{task_id}`

如果你控制台里的实际接口字段不同，直接在页面里改即可，不需要改代码。

`额外参数 JSON` 可以用来补充账号特有字段，例如：

```json
{
  "return_last_frame": true
}
```

## 注意

当前实现把首帧和尾帧作为两张参考图发送。不同火山模型/账号能力下，尾帧可能被当作强约束终帧，也可能只是额外参考图。如果你确认了你账号下的精确字段名，我可以再帮你把这套页面收敛成严格匹配你那条 API 的正式版。
