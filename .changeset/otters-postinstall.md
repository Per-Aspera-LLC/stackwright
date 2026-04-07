---
"@stackwright/otters": minor
---

Add postinstall script to install otters to ~/.code_puppy/agents/

- Created scripts/install-agents.js that copies agent JSON files to ~/.code_puppy/agents/
- Updated package.json with postinstall hook
- Updated README with installation instructions
- Fixed .code-puppy.json config (removed agents_path)
- Bumped version to 0.2.0-alpha.1
