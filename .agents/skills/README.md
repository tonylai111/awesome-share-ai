# Thinking Toolkit Skills（跨 Agent）

这 12 个 `tools-*` 技能遵循 Agent Skills 的 `SKILL.md` 标准，可被多种 Agent 发现：

| 位置 | 谁用 |
|---|---|
| `.cursor/skills/tools-*` | Cursor |
| `.claude/skills/tools-*` | Claude Code（本仓库） |
| `.codex/skills/tools-*` | Codex（本仓库） |
| `.agents/skills/tools-*` | 通用标准 |
| `~/.claude/skills/tools-*` | Claude Code（全局） |
| `~/.codex/skills/tools-*` | Codex（全局） |
| `~/.hermes/skills/tools-*` | Hermes Agent（全局） |

调用示例：`/tools-explain2layer`、`/tools-socrates`、`/tools-talentdig`。

Hermes 若刚拷贝还不显示：在会话里执行 `/reload-skills`。
