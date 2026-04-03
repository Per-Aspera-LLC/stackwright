const { execSync } = require('child_process');

function getChangedFiles() {
  const base = process.env.GITHUB_BASE_REF || 'dev';

  try {
    // Ensure the base branch exists locally
    execSync(`git fetch origin ${base}:refs/remotes/origin/${base}`, { 
      stdio: 'pipe',
      timeout: 10000 
    });

    // Strategy 1: Try direct diff with origin/base...HEAD
    try {
      const diff = execSync(`git diff --name-only origin/${base}...HEAD`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return diff.split('\n').filter(Boolean);
    } catch (diffErr) {
      console.log('⚠️ Direct diff failed (likely no merge base)');
    }

    // Strategy 2: For merge commits, diff HEAD^1 (target) against HEAD^2 (PR)
    try {
      const targetRef = execSync('git rev-parse --verify HEAD^1', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
      
      const prRef = execSync('git rev-parse --verify HEAD^2', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
      
      console.log(`Using merge commit strategy: target=${targetRef.slice(0,8)}, pr=${prRef.slice(0,8)}`);
      
      const diff = execSync(`git diff --name-only ${targetRef}...${prRef}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return diff.split('\n').filter(Boolean);
    } catch (mergeErr) {
      console.log('⚠️ Merge commit strategy failed:', mergeErr.message);
    }

    // Strategy 3: Try HEAD^1 diff (single parent commits)
    try {
      const parent = execSync('git rev-parse --verify HEAD^1', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
      
      console.log(`Using single-parent strategy: parent=${parent.slice(0,8)}`);
      
      const diff = execSync(`git diff --name-only origin/${base}...${parent}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return diff.split('\n').filter(Boolean);
    } catch (singleErr) {
      console.log('⚠️ Single-parent strategy failed');
    }

    // Strategy 4: If we have fetch-depth: 0, try to find the PR branch
    try {
      // Get all branches and find ones that might be the PR branch
      const branches = execSync('git branch -r --format="%(refname:short)"', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      
      // Look for pull request refs
      const prRefs = branches.split('\n').filter(ref => ref.includes('pull/'));
      if (prRefs.length > 0) {
        console.log(`Found PR refs: ${prRefs.join(', ')}`);
        const prRef = prRefs[0].replace('origin/', '');
        const diff = execSync(`git diff --name-only origin/${base}...${prRef}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        return diff.split('\n').filter(Boolean);
      }
    } catch (branchErr) {
      console.log('⚠️ PR branch lookup failed');
    }

    throw new Error('All diff strategies exhausted');
  } catch (err) {
    console.error(`❌ Could not determine changed files from ${base}:`, err.message);
    process.exit(1);
  }
}

function hasPackageChanges(files) {
  return files.some((file) => file.startsWith('packages/'));
}

function hasChangeset(files) {
  return files.some((file) => file.startsWith('.changeset/') && file.endsWith('.md'));
}

const changedFiles = getChangedFiles();

if (hasPackageChanges(changedFiles) && !hasChangeset(changedFiles)) {
  console.error(
    '\x1b[31m❌ This PR modifies packages but includes no Changeset.\n' +
      'Please run: pnpm changeset\x1b[0m'
  );
  process.exit(1);
} else {
  console.log('✅ Changeset requirement satisfied.');
}
