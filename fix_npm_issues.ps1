# Fix NPM Platform Issues - Run these commands in PowerShell

# Step 1: Clear npm cache
npm cache clean --force

# Step 2: Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Step 3: Install packages with platform override
npm install --force

# Alternative if above doesn't work:
# npm install --legacy-peer-deps

# Alternative if still having issues:
# npm install --platform=win32 --arch=x64


