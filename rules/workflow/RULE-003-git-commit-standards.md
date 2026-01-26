# RULE-003: Git 提交规范

> 版本: 1.0
> 作者: Boris Huai
> 创建日期: 2026-01-26
> 状态: 生效中

---

## 1. 概述

本规则定义 BorisAgentStudio 项目的 Git 提交消息格式、分支命名和 PR 规范。

---

## 2. Commit Message 格式

### 2.1 基本格式

```
<type>(<scope>): <subject>

[body]

[footer]
```

### 2.2 Type 类型

| Type | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(search): add session search` |
| `fix` | Bug 修复 | `fix(phase): correct expand state` |
| `docs` | 文档变更 | `docs(readme): update install guide` |
| `style` | 代码格式 (不影响逻辑) | `style: fix indentation` |
| `refactor` | 重构 (不新增功能或修复) | `refactor(store): simplify state` |
| `perf` | 性能优化 | `perf(render): use virtualization` |
| `test` | 测试相关 | `test(utils): add groupToolCalls tests` |
| `chore` | 构建/工具变更 | `chore(deps): update vitest` |
| `ci` | CI 配置变更 | `ci: add coverage check` |

### 2.3 Scope 范围

| Scope | 描述 |
|-------|------|
| `phase` | PhaseGroup 相关组件 |
| `tool` | ToolDetailPanel 相关 |
| `layout` | 布局组件 (Header, StatusBar) |
| `search` | 搜索过滤功能 |
| `export` | 导出功能 |
| `api` | API/WebSocket 相关 |
| `store` | 状态管理 |
| `utils` | 工具函数 |
| `types` | 类型定义 |
| `deps` | 依赖更新 |

### 2.4 Subject 规则

- 使用祈使句 ("add" 而非 "added" 或 "adds")
- 首字母小写
- 不加句号结尾
- 不超过 50 个字符

### 2.5 Body 规则

- 空一行后开始
- 解释 "什么" 和 "为什么"，而非 "如何"
- 每行不超过 72 个字符

### 2.6 Footer 规则

- 引用 Issue: `Closes #123`, `Fixes #456`
- 破坏性变更: `BREAKING CHANGE: description`

---

## 3. 提交示例

### 3.1 简单提交

```
feat(search): add session keyword search

Closes #42
```

### 3.2 详细提交

```
fix(phase): prevent multiple phases expanding simultaneously

Previously, clicking on phase nodes could result in multiple
phases being expanded at the same time, causing UI confusion.

This change unifies the expansion state into a single variable,
ensuring mutual exclusion between input display and phase expansion.

Fixes #87
```

### 3.3 破坏性变更

```
feat(api): change session response format

BREAKING CHANGE: The session API now returns data wrapped in
a `data` field. Clients must update to access `response.data`
instead of `response` directly.

Migration guide:
- Before: const session = await fetchSession(id)
- After:  const { data: session } = await fetchSession(id)
```

---

## 4. 分支命名

### 4.1 分支类型

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feature/` | 新功能 | `feature/session-search` |
| `bugfix/` | Bug 修复 | `bugfix/phase-expand-state` |
| `hotfix/` | 紧急修复 | `hotfix/crash-on-load` |
| `docs/` | 文档更新 | `docs/api-reference` |
| `refactor/` | 重构 | `refactor/store-simplify` |
| `test/` | 测试相关 | `test/add-e2e-coverage` |
| `chore/` | 构建/配置 | `chore/update-deps` |

### 4.2 命名规则

- 使用小写字母
- 使用连字符分隔单词
- 简洁但有描述性
- 可包含 Issue 编号: `feature/42-session-search`

---

## 5. PR 规范

### 5.1 PR 标题

格式与 Commit Message 相同：

```
feat(search): add session keyword search
```

### 5.2 PR 模板

```markdown
## Summary

Brief description of changes.

## Changes

- Added X
- Modified Y
- Fixed Z

## Test Plan

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests pass

## Screenshots (if applicable)

## Related Issues

Closes #42
```

### 5.3 PR 检查清单

- [ ] 代码遵循 STD-002 编码规范
- [ ] 添加/更新了相关测试
- [ ] 文档已更新 (如适用)
- [ ] 无 console.log/debugger 遗留
- [ ] 无敏感信息泄露
- [ ] CI 检查通过

---

## 6. Git 工作流

### 6.1 功能开发流程

```bash
# 1. 从 main 创建功能分支
git checkout main
git pull origin main
git checkout -b feature/session-search

# 2. 开发并提交
git add .
git commit -m "feat(search): add session keyword search"

# 3. 推送并创建 PR
git push origin feature/session-search
# 在 GitHub 创建 PR

# 4. 合并后清理
git checkout main
git pull origin main
git branch -d feature/session-search
```

### 6.2 合并策略

- **功能分支 → main**: Squash and merge
- **热修复 → main**: Merge commit
- **main → release**: Merge commit

---

## 7. 提交频率建议

### 7.1 推荐做法

- 每个逻辑单元一个提交
- 保持提交原子性 (一个提交做一件事)
- 频繁提交，避免大型提交

### 7.2 示例拆分

```
# ❌ 不推荐：一个大提交
feat: add search feature with tests and docs

# ✅ 推荐：拆分为多个小提交
feat(search): add search component
test(search): add search component tests
docs(search): add search usage guide
```

---

## 8. 常见错误

### 8.1 避免的做法

```
# ❌ 模糊的提交信息
git commit -m "fix bug"
git commit -m "update code"
git commit -m "changes"
git commit -m "WIP"

# ❌ 混合多个变更
git commit -m "fix bug and add feature and update docs"

# ❌ 包含无关文件
git add .  # 可能包含不相关文件
```

### 8.2 推荐做法

```
# ✅ 具体描述
git commit -m "fix(phase): correct expand state on click"

# ✅ 单一职责
git commit -m "fix(phase): correct expand state"
git commit -m "feat(phase): add collapse all button"

# ✅ 选择性暂存
git add src/components/PhaseNode.tsx
git commit -m "fix(phase): correct expand state"
```

---

## 9. 工具配置

### 9.1 Commitlint

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci']
    ],
    'scope-enum': [
      1,
      'always',
      ['phase', 'tool', 'layout', 'search', 'export', 'api', 'store', 'utils', 'types', 'deps']
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 50],
    'body-max-line-length': [2, 'always', 72],
  },
}
```

### 9.2 Husky + lint-staged

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 10. 相关文档

- [Conventional Commits](https://www.conventionalcommits.org/)
- [STD-002](../../standards/coding/STD-002-coding-standards.md) - 编码规范
- [RULE-004](./RULE-004-code-review.md) - 代码审查规范
