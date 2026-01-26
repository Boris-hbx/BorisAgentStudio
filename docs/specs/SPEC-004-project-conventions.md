# SPEC-004: 项目约定与文件夹规范

> 作者: Boris Huai
> 起草日期: 2026-01-24
> 状态: 草稿

---

## 概述

定义项目中 rules、skills、standards 等文件夹的用途和命名规范，建立统一的项目约定体系。

---

## 文件夹结构

```
BorisAgentStudio/
├── rules/                    # 项目规则定义
│   ├── coding/               # 编码规则
│   ├── naming/               # 命名规则
│   └── workflow/             # 工作流规则
├── skills/                   # Agent 技能定义
│   ├── builtin/              # 内置技能
│   └── custom/               # 自定义技能
├── standards/                # 标准与规范
│   ├── api/                  # API 规范
│   ├── data/                 # 数据格式规范
│   └── visual/               # 可视化规范
├── docs/
│   └── specs/                # 功能规格文档
└── ...
```

---

## rules/ 文件夹

### 用途

存放项目开发规则，约束代码风格、流程和行为。

### 命名规范

```
RULE-{序号}-{规则名}.md
```

- 三位数字序号，从 001 开始
- 规则名使用小写字母和连字符

### 示例

```
rules/
├── RULE-001-file-naming.md
├── RULE-002-component-structure.md
└── RULE-003-error-handling.md
```

### 文档格式

```markdown
# RULE-{序号}: {规则标题}

> 作者: Boris Huai
> 创建日期: YYYY-MM-DD
> 状态: 生效 | 废弃

## 规则描述

{具体规则内容}

## 适用范围

{哪些场景需要遵守}

## 示例

{正确和错误示例}
```

---

## skills/ 文件夹

### 用途

定义 Code Agent 可调用的技能，包括技能描述、参数和调用方式。

### 命名规范

```
SKILL-{序号}-{技能名}.json
```

- 三位数字序号，从 001 开始
- 技能名使用小写字母和连字符

### 示例

```
skills/
├── builtin/
│   ├── SKILL-001-code-generation.json
│   ├── SKILL-002-task-decomposition.json
│   └── SKILL-003-result-verification.json
└── custom/
    └── SKILL-001-domain-specific.json
```

### 技能文件格式

```json
{
  "id": "skill-{id}",
  "name": "技能名称",
  "description": "技能描述",
  "version": "1.0.0",
  "source": "builtin | custom",
  "parameters": [
    {
      "name": "param1",
      "type": "string",
      "required": true,
      "description": "参数描述"
    }
  ],
  "outputs": {
    "type": "object",
    "description": "输出描述"
  },
  "examples": []
}
```

---

## standards/ 文件夹

### 用途

存放项目标准和规范文档，定义 API、数据格式、可视化等方面的标准。

### 命名规范

```
STD-{序号}-{标准名}.md
```

- 三位数字序号，从 001 开始
- 标准名使用小写字母和连字符

### 示例

```
standards/
├── api/
│   ├── STD-001-rest-api.md
│   └── STD-002-websocket-events.md
├── data/
│   ├── STD-001-session-format.md
│   └── STD-002-step-format.md
└── visual/
    ├── STD-001-color-system.md
    └── STD-002-node-states.md
```

### 文档格式

```markdown
# STD-{序号}: {标准标题}

> 作者: Boris Huai
> 创建日期: YYYY-MM-DD
> 版本: 1.0.0
> 状态: 草稿 | 生效 | 废弃

## 概述

{标准的目的和适用范围}

## 规范内容

{详细规范定义}

## 变更历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | YYYY-MM-DD | 初始版本 |
```

---

## 与 CLAUDE.md 的同步

### 自动同步规则

以下内容变更时，需要同步更新到 CLAUDE.md：

1. **技术栈变更**：rules/ 中涉及技术栈的规则
2. **核心数据字段**：standards/data/ 中的字段定义
3. **端口配置**：standards/api/ 中的端口定义
4. **文件夹结构**：新增顶层文件夹时

### 同步方式

Claude Code 在创建或修改上述文件时，应主动检查并提议更新 CLAUDE.md。

---

## 相关文档

- [CLAUDE.md](../../CLAUDE.md) - 项目主规范
- [SPEC-001](./SPEC-001-project-overview.md) - 项目总览
