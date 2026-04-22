# AI-Rider｜首尾帧视频输出桌面客户端

一个最快上线版的本地 Web 控制台，用来做“首帧 + 尾帧 + 提示词”的火山引擎视频生成。

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

```bash
cd '/Users/silence/Documents/AI-Rider｜首尾帧视频输出桌面客户端'
node server.js
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
