# AI-Rider Video｜AI 视频生成工作台

**中文** | [English](./README.md)

AI-Rider Video 正在从“首帧 + 尾帧 + 提示词”的桌面工具，升级为一个模板驱动、多模型、多路径的 AI 视频生成工作台。

当前稳定版本：`2.3.0`

## 文档导航

- [版本历史](./docs/version-history.md)
- [2.0.0 PRD 初稿](./docs/versions/2.0.0.md)
- [1.x 版本档案](./docs/versions/1.0.0.md)
- [1.1.3 发布说明](./docs/releases/1.1.3.md)
- [桌面端环境说明](./docs/desktop-environment.md)
- [桌面端路线图](./docs/desktop-app-roadmap.md)

## 2.x 版本概览

`2.x` 是 AI-Rider Video 从单一桌面工具走向产品体系化的主线版本。

- `2.0.x`：模型适配、提供方抽象、激活码能力准备
- `2.1.x`：产品表达升级、工作台体验成型
- `2.2.x`：工作台扩展、素材复用与模板/模型入口页
- `2.3.x`：商业化增强与 AI-Rider 体系联动

当前 `2.3.0` 的重点，是在工作台扩展完成后，补齐桌面端激活与注册码体系：

- 首次打开进入激活引导页
- 用户可通过微信领取体验码或正式注册码
- 注册码按 `5 / 50 / 100 / 1000` 次分档
- 激活成功后解锁视频生成工作台
- 创建任务成功后按次扣减，失败不扣次
- 内置注册码管理 CLI，可由你自行生成与管理注册码

## 功能

- 模板驱动的视频生成工作流
- 首尾帧生成
- 首帧生成
- 文生视频
- 实验性视频延展入口
- 基于注册表的多模型能力映射
- 基于 Token 的本地费用估算
- API / JSON / 调试高级面板
- 后端任务创建、轮询、结果查看与本地下载
- 首次安装后激活引导
- 激活码状态校验与剩余次数控制
- 注册码生成、冻结、作废与重置设备绑定

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

- 页面：`public/`
- 下载视频：`downloads/`

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

当前实现把首帧和尾帧作为两张参考图发送。不同火山模型或账号能力下，尾帧可能被当作强约束终帧，也可能只是额外参考图。
