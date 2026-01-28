# GUIDE-001: 使用 Clawdbot 实现手机远程开发

> 作者: Boris Huai
> 创建日期: 2026-01-27
> 状态: 草稿

## 概述

本指南介绍如何使用 [Clawdbot](https://github.com/clawdbot/clawdbot) 从手机远程操作电脑上的 Claude Code，实现随时随地开发。

## 架构图

```
┌─────────────┐     互联网      ┌─────────────────────────────────┐
│   手机      │                 │        Windows 电脑              │
│  Telegram   │◄───────────────►│  Clawdbot ──► Claude Code       │
│  /WhatsApp  │                 │              ──► BorisAgentStudio│
└─────────────┘                 └─────────────────────────────────┘
```

## 前置条件

- [x] Windows 10/11 电脑
- [x] 已安装 Claude Code
- [x] 已配置 Anthropic API Key
- [ ] Node.js >= 22
- [ ] WSL2 (推荐)

## 方案选择

| 方案 | 消息渠道 | 适用场景 |
|------|----------|----------|
| A | Telegram | 有代理，体验最佳 |
| B | WhatsApp | 国内直连，需手机在线 |

---

## 方案 A: Telegram (推荐)

### 步骤 1: 创建 Telegram Bot

1. 打开 Telegram，搜索 `@BotFather`
2. 发送 `/newbot`
3. 按提示设置 Bot 名称和用户名
4. 保存获得的 **Bot Token**（格式：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 步骤 2: 获取你的 Telegram ID

1. 搜索 `@userinfobot`
2. 发送任意消息
3. 记录返回的 **User ID**（纯数字）

### 步骤 3: 安装 Clawdbot (WSL2)

```bash
# 打开 WSL2 终端

# 确保 Node.js >= 22
node -v

# 安装 Clawdbot
npm install -g moltbot@latest

# 验证安装
moltbot --version
```

### 步骤 4: 初始化配置

```bash
# 运行向导
moltbot onboard --install-daemon
```

### 步骤 5: 配置 Telegram

编辑配置文件 `~/.clawdbot/moltbot.json`:

```json5
{
  // Telegram 渠道配置
  channels: {
    telegram: {
      // 你的 Bot Token
      botToken: "YOUR_BOT_TOKEN_HERE",
      // 只允许你的 Telegram ID
      allowFrom: ["YOUR_TELEGRAM_ID"],
      // 禁用群聊
      groups: {}
    }
  },

  // Claude Code 集成
  agent: {
    type: "claude-code",
    // 默认工作目录
    workingDir: "/mnt/c/Project/boris-workspace/BorisAgentStudio"
  },

  // 消息设置
  messages: {
    // 流式响应
    streaming: true,
    // 代码块格式
    codeFormat: "markdown"
  }
}
```

### 步骤 6: 启动服务

```bash
# 启动 Gateway (daemon 模式)
moltbot gateway

# 或前台运行（调试用）
moltbot gateway --foreground
```

### 步骤 7: 测试

1. 打开 Telegram，找到你创建的 Bot
2. 发送: `你好，请列出当前目录的文件`
3. 等待 Claude Code 执行并返回结果

---

## 方案 B: WhatsApp

### 步骤 1: 安装 Clawdbot

同方案 A 步骤 3。

### 步骤 2: 配置 WhatsApp

```bash
# 登录 WhatsApp Web
moltbot channels login whatsapp
```

扫描显示的二维码。

### 步骤 3: 配置文件

编辑 `~/.clawdbot/moltbot.json`:

```json5
{
  channels: {
    whatsapp: {
      // 你的手机号（国际格式）
      allowFrom: ["+86138XXXXXXXX"],
      // 群聊需要 @提及
      groups: {
        "*": { requireMention: true }
      }
    }
  },

  agent: {
    type: "claude-code",
    workingDir: "/mnt/c/Project/boris-workspace/BorisAgentStudio"
  }
}
```

### 步骤 4: 启动并测试

```bash
moltbot gateway
```

在 WhatsApp 中给自己发消息测试。

---

## 常用命令

### 在手机上发送

| 命令示例 | 说明 |
|----------|------|
| `帮我运行测试` | 执行 npm test |
| `查看 App.tsx 的内容` | 读取文件 |
| `修复登录页面的样式问题` | 执行开发任务 |
| `git status` | 查看 git 状态 |
| `构建项目` | 执行 npm run build |

### Clawdbot 管理命令

```bash
# 查看状态
moltbot status

# 查看日志
moltbot logs

# 重启服务
moltbot restart

# 停止服务
moltbot stop
```

---

## 故障排查

### 问题 1: Telegram Bot 无响应

**检查清单:**
- [ ] Bot Token 是否正确
- [ ] allowFrom 是否包含你的 Telegram ID
- [ ] Gateway 是否在运行
- [ ] 网络代理是否正常

```bash
# 查看日志
moltbot logs --tail 50
```

### 问题 2: WhatsApp 断开连接

WhatsApp Web 需要手机保持在线。如果断开：

```bash
# 重新登录
moltbot channels login whatsapp
```

### 问题 3: Claude Code 无法执行

```bash
# 检查 Claude Code 是否可用
claude --version

# 检查 API Key
echo $ANTHROPIC_API_KEY
```

---

## 安全建议

1. **严格白名单**: 只允许你自己的账号
2. **不要分享 Bot Token**: 防止他人控制
3. **定期检查日志**: 监控异常访问
4. **使用私聊**: 避免在群聊中暴露敏感信息

---

## 参考资料

- [Clawdbot 官方文档](https://docs.molt.bot/)
- [Clawdbot GitHub](https://github.com/clawdbot/clawdbot)
- [Telegram Bot API](https://core.telegram.org/bots/api)
