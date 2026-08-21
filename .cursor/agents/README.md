# Thinking Toolkit

跨 Agent 技能已放到：

```text
.cursor/skills/tools-*     # Cursor
.claude/skills/tools-*     # Claude Code
.codex/skills/tools-*      # Codex
.agents/skills/tools-*     # 通用标准
```

全局副本（本机所有项目可用）：

```text
~/.claude/skills/tools-*
~/.codex/skills/tools-*
~/.hermes/skills/tools-*
```

在对应 Agent 里输入 `/tools` 即可筛选。Hermes 新装技能后执行一次 `/reload-skills`。
