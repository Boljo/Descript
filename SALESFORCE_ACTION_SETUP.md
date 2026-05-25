# Salesforce DevOps Change Analyzer - Setup Guide

## 📋 Overview

This reusable GitHub Action automatically analyzes Salesforce metadata changes when a PR is created, uses an LLM to generate intelligent summaries, and appends them to the PR description. Perfect for the beginning of your DevOps center pipeline!

## 🎯 Features

✅ **Automatic PR Triggers** - Runs on every PR opened/updated with `force-app/` changes  
✅ **Metadata-Aware** - Detects ApexClass, CustomObject, Flow, Lightning Components, etc.  
✅ **LLM Integration** - Works with OpenAI, Claude, Azure OpenAI, or any LLM API  
✅ **Smart Summaries** - AI-generated technical deployment notes  
✅ **PR Comments** - Detailed analysis comment with change breakdown  
✅ **Reusable Action** - Can be used in other repos via `uses: Boljo/Descript/.github/actions/salesforce-change-analyzer@main`

## 🔧 Setup Instructions

### Step 1: Add GitHub Secrets

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add your LLM API key:
   - **Name**: `LLM_API_KEY`
   - **Value**: Your actual API key (OpenAI, Claude, Azure, etc.)

### Step 2: Add GitHub Variables

1. In the same section, click **New repository variable**
2. Add LLM configuration (choose ONE based on your provider):

#### Option A: OpenAI
- **Name**: `LLM_API_ENDPOINT`
- **Value**: `https://api.openai.com/v1/completions`

#### Option B: Azure OpenAI
- **Name**: `LLM_API_ENDPOINT`
- **Value**: `https://<your-instance>.openai.azure.com/openai/deployments/<deployment-id>/completions?api-version=2023-05-15`

#### Option C: Anthropic Claude
- **Name**: `LLM_API_ENDPOINT`
- **Value**: `https://api.anthropic.com/v1/messages`

#### Optional: Target Org
- **Name**: `TARGET_ORG`
- **Value**: `production` (or your org name)

### Step 3: Test the Action

1. Create a PR with changes to `force-app/` directory
2. Watch the workflow run in the **Actions** tab
3. Check the PR for:
   - Updated description with AI summary
   - Detailed analysis comment

## 📁 Project Structure

```
.github/
├── workflows/
│   └── salesforce-descript.yml          # Main workflow (triggered on PRs)
└── actions/
    └── salesforce-change-analyzer/
        ├── action.yml                    # Action definition
        └── analyze.js                    # Core analysis script
```

## 🚀 How It Works

1. **PR Created** → Workflow triggers on PR with force-app changes
2. **Fetch Changes** → GitHub API retrieves all modified files
3. **Analyze Metadata** → Script categorizes Salesforce components
4. **Call LLM** → Sends analysis to your configured LLM API
5. **Update PR** → AI summary appended to PR description
6. **Add Comment** → Detailed breakdown posted as PR comment

## 📊 Example Output

### PR Description (Updated)
```markdown
## AI-Generated Change Summary
Modified ApexClass, CustomObject, Flow metadata. 
Total changes: 247 lines across 12 files. 
Includes new validation rules on Account object and refactored batch process.

---
Original PR description...
```

### PR Comment
```
## Salesforce DevOps Analysis Report

### Change Summary
- **Total Files**: 12
- **Lines Added**: 180
- **Lines Deleted**: 67

### Metadata Types Modified
- **ApexClass**: 3 file(s)
- **CustomObject**: 2 file(s)
- **Flow**: 2 file(s)
- **Layout**: 5 file(s)

### Files Changed
- force-app/main/default/classes/BatchProcessor.cls (modified, 45 changes)
- force-app/main/default/objects/Account/validationRules/NewValidation.validationRule-meta.xml (added, 12 changes)
...
```

## 🔄 Using This Action in Other Repos

Reference this reusable action in any repo:

```yaml
- name: Analyze Salesforce Changes
  uses: Boljo/Descript/.github/actions/salesforce-change-analyzer@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    llm-api-key: ${{ secrets.LLM_API_KEY }}
    llm-api-endpoint: ${{ vars.LLM_API_ENDPOINT }}
    pr-number: ${{ github.event.pull_request.number }}
    repo-owner: ${{ github.repository_owner }}
    repo-name: ${{ github.event.repository.name }}
```

## 🛠️ Customization

### Modify LLM Prompt
Edit the `generatePrompt()` function in `.github/actions/salesforce-change-analyzer/analyze.js` to customize the analysis request.

### Change Trigger Events
In `.github/workflows/salesforce-descript.yml`, modify the `on.pull_request.types` to trigger on different PR events:
```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
```

### Filter by Paths
Add path filtering to only run on Salesforce metadata changes:
```yaml
on:
  pull_request:
    paths:
      - 'force-app/**'
      - 'sfdx-project.json'
```

## 🐛 Troubleshooting

### Action Not Triggering
- ✓ Check PR has changes in `force-app/` directory
- ✓ Verify workflow file is in `main` branch
- ✓ Check Actions are enabled in repo settings

### LLM API Errors
- ✓ Verify `LLM_API_KEY` secret is set correctly
- ✓ Check `LLM_API_ENDPOINT` variable is valid
- ✓ Ensure API key has permissions for that endpoint
- ✓ Check API quota/rate limits

### PR Update Failed
- ✓ Verify `GITHUB_TOKEN` has PR write permissions
- ✓ Check repo isn't in protected branch mode
- ✓ Review GitHub Actions logs for error details

### View Logs
1. Go to PR → **Checks** tab
2. Click "Salesforce DevOps - Change Analyzer"
3. View detailed logs of the workflow run

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | ✓ | GitHub API access (auto-provided) |
| `LLM_API_KEY` | ✓ | Your LLM service API key (Secret) |
| `LLM_API_ENDPOINT` | ✓ | LLM API URL (Variable) |
| `TARGET_ORG` | ✗ | Salesforce org name (Variable, default: production) |
| `PR_NUMBER` | ✓ | PR number (auto-populated) |
| `REPO_OWNER` | ✓ | Repository owner (auto-populated) |
| `REPO_NAME` | ✓ | Repository name (auto-populated) |

## 🔐 Security Notes

- Never hardcode API keys in workflow files
- Use GitHub **Secrets** for sensitive data (API keys)
- Use GitHub **Variables** for non-sensitive config
- This action has read-only access to repo contents by default
- PR write permissions are explicitly granted in workflow

## 📚 LLM Provider Guides

### OpenAI
```
API Key: Get from https://platform.openai.com/api-keys
Endpoint: https://api.openai.com/v1/completions
Model: gpt-3.5-turbo or gpt-4
```

### Anthropic Claude
```
API Key: Get from https://console.anthropic.com/
Endpoint: https://api.anthropic.com/v1/messages
Model: claude-3-opus or claude-3-sonnet
```

### Azure OpenAI
```
API Key: Get from Azure Portal
Endpoint: https://{resource}.openai.azure.com/openai/deployments/{deployment-id}/completions?api-version=2023-05-15
```

## 💡 Next Steps

1. ✅ Set up secrets and variables
2. ✅ Create a test PR with force-app changes
3. ✅ Monitor the workflow in Actions tab
4. ✅ Review PR description and comments
5. ✅ Integrate into your DevOps pipeline

---

**Happy deploying! 🚀** Questions? Check the workflow logs or review `analyze.js` for implementation details.
