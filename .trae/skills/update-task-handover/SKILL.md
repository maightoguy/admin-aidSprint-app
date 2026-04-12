---
name: Update task handover
description: In other to facilitate handing over the project context of a chat to another chat, we need to constantly update the Task_handover summary file.
---

# Instruction
After completing any user request or task (e.g., refactoring, bug fix, feature addition), you MUST automatically update a file located at `.trae/Task_handover.md`. 

The file should follow this structure:
- ## Status: [Completed/In-Progress]
- ## Latest Changes: [Bullet points of code modified]
- ## Current Context: [Summary of logic, active variables, or architecture state]
- ## Next Steps: [What needs to be done next in a new chat]

# Trigger
Use this skill implicitly whenever a task is marked as "Done" or the user says "thanks."