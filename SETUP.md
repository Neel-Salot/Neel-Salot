# 🚀 Setting Up Your Neel-Bot Profile README

Here is how you can deploy this dynamic, interactive profile to your GitHub account:

## 1. Create Your Profile Repository
1. On GitHub, create a new public repository named **exactly** matching your GitHub username (e.g., if your username is `Neel-Salot`, name the repo `Neel-Salot`). This creates your special GitHub Profile README.
2. Initialize it with a main branch.

## 2. Add files
Copy the contents of this local workspace (`C:\Users\NEEL\.gemini\antigravity\scratch\github-profile-readme`) into your local clone of the profile repository:
- `README.md` (root directory)
- `package.json` (root directory)
- `.github/workflows/neel-bot.yml`
- `.github/ISSUE_TEMPLATE/` (all 3 YAML templates)
- `scripts/neel-bot.js`
- `assets/` (all SVG assets)

Commit and push these files to the main branch.

## 3. Configure Repository Secrets
To enable the **Gemini-powered AI Agent Console**:
1. Go to your repository on GitHub.
2. Click **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Click **New repository secret**.
4. Set the name to **`GEMINI_API_KEY`**.
5. Set the value to your Gemini API Key (you can get one for free from Google AI Studio).

## 4. Enable Workflow Write Permissions
To allow the GitHub Actions bot to update your README and SVGs when someone interacts with it:
1. Under **Settings** in your repository, go to **Actions** ➔ **General**.
2. Scroll down to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Check **Allow GitHub Actions to create and approve pull requests** (if needed, but write permissions are the main key).
5. Click **Save**.

## 5. Test It!
1. Go to your repository's homepage or profile.
2. Under the **Neel-Bot Agent Console** section, click one of the interactive buttons (e.g., `🤖 Ask Neel-Bot` or `☕ Buy Virtual Coffee`).
3. Fill out the issue template form and click **Submit new issue**.
4. Go to the **Actions** tab of your repository. You will see the **Neel-Bot Agent Loop** workflow start automatically.
5. In about 30 seconds, the workflow will:
   - Call Gemini to formulate a personalized, system-focused answer.
   - Reply to and close the issue.
   - Re-generate the dark/light SVG terminal consoles with the new event data.
   - Prepend the event log to the profile `README.md`.
6. Return to your profile and watch the console change!
