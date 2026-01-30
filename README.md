# Video Replication MCP Server

为 AI 助手提供视频复刻能力的 MCP (Model Context Protocol) 服务器。

## 功能

| 工具 | 描述 | 积分消耗 |
|------|------|----------|
| `replicate_video` | 创建视频复刻任务 | 150 |
| `get_generation_status` | 查询任务状态 | 0 |
| `get_credits_balance` | 查询积分余额 | 0 |

## 安装

```bash
cd mcp-server
npm install
npm run build
```

## 配置

设置环境变量：

```bash
export VIDEO_API_BASE_URL="https://your-app.com"
export VIDEO_API_KEY="pk_live_xxxxx"
```

## 使用方式

### 1. Claude Desktop

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "video-replication": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "VIDEO_API_BASE_URL": "https://your-app.com",
        "VIDEO_API_KEY": "pk_live_xxxxx"
      }
    }
  }
}
```

### 2. Claude Code

编辑 `~/.claude/claude_config.json`:

```json
{
  "mcpServers": {
    "video-replication": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "VIDEO_API_BASE_URL": "https://your-app.com",
        "VIDEO_API_KEY": "pk_live_xxxxx"
      }
    }
  }
}
```

### 3. Moltbot

参考 [Moltbot MCP 文档](https://docs.molt.bot/mcp) 配置。

## 示例对话

**用户**: 帮我用这张产品图和这个参考视频生成一个复刻视频
- 图片: https://example.com/product.jpg
- 视频: https://example.com/reference.mp4

**AI**: 好的，我来为你创建视频复刻任务。

[调用 replicate_video]

任务已创建！
- 任务 ID: abc123
- 预计时间: 2-5 分钟
- 消耗积分: 150

**用户**: 完成了吗？

**AI**: 让我查一下状态。

[调用 get_generation_status]

任务已完成！
- 状态: completed
- 视频 URL: https://...

## API 参考

### replicate_video

创建视频复刻任务。

**参数**:
- `imageUrl` (必需): 产品图片 URL
- `videoUrl` (必需): 参考视频 URL
- `language` (可选): 脚本语言，默认 "中文"
- `webhookUrl` (可选): 完成回调 URL

**返回**:
```json
{
  "success": true,
  "data": {
    "id": "generation-id",
    "status": "pending",
    "creditsCost": 150
  }
}
```

### get_generation_status

查询任务状态。

**参数**:
- `generationId` (必需): 任务 ID

**返回**:
```json
{
  "success": true,
  "data": {
    "id": "generation-id",
    "status": "completed",
    "progress": 100,
    "resultUrl": "https://...",
    "thumbnailUrl": "https://..."
  }
}
```

### get_credits_balance

查询积分余额。

**返回**:
```json
{
  "success": true,
  "data": {
    "balance": 500,
    "currency": "credits"
  }
}
```

## 开发

```bash
# 开发模式（自动编译）
npm run dev

# 构建
npm run build

# 启动
npm start
```

## License

MIT
