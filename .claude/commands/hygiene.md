Pre-work checklist. Before starting any agent-driven feature work, confirm:

1. **Worktree**: run `pwd` + `git branch`. Am I in the right worktree for this feature? If working on a non-trivial feature, suggest creating one: `git worktree add .claude/worktrees/<feature-name> -b <branch-name>`.

2. **Spec**: is there an active spec under `memory-bank/` for this work? If yes, read it. If no, ask the user if we should write one before coding (`memory-bank/<feature>.md` with in-scope, out-of-scope, demo script, acceptance criteria).

3. **Demo script**: can the user state in one sentence what the demo of this feature looks like? If not, the feature isn't ready to build. Pause and elicit.

4. **Acceptance criteria**: is there a clear "done" condition? If not, define one with the user.

5. **Commit clean**: run `git status`. Any uncommitted changes? Suggest committing or stashing first so clawback is easy.

Report findings tersely. If anything is unclear, ask the user before doing any work. Do NOT start coding.
