# Mistbound

Static HTML/CSS/JavaScript project prepared for Vercel.

## Deploy

1. Import the repository in Vercel.
2. Set **Root Directory** to `Pront` if the repository contains this folder; use `.` if `Pront` itself is the repository root.
3. Choose **Other** as the Framework Preset.
4. Leave the Build Command and Install Command empty.
5. Set the Output Directory to `.`.

`index.html` is the site entry point. Its stylesheet, script, and optimized background image use relative paths. No build step or `vercel.json` is required.

Game saves and settings currently use browser `localStorage`; they are not shared across browsers or devices.