# Reusable Salesforce DevOps Change Analyzer

A production-ready GitHub Action for the Salesforce DevOps Center pipeline that automatically analyzes metadata changes in pull requests and uses AI/LLM to generate intelligent deployment summaries.

## 🎯 What This Does

When a PR is created with Salesforce metadata changes:

1. **Detects Changes** - Identifies all modified Salesforce components (ApexClass, CustomObject, Flow, etc.)
2. **Analyzes Impact** - Categorizes changes by metadata type and complexity
3. **Generates Summary** - Calls your configured LLM (OpenAI, Claude, Azure) to create a concise technical summary
4. **Updates PR** - Appends AI-generated summary to PR description
5. **Posts Comment** - Adds detailed analysis comment with file-by-file breakdown

## 🚀 Quick Start (5 minutes)

### 1. Add Secrets
Go to repo **Settings → Secrets and variables → Actions** and add:
- `LLM_API_KEY` = Your API key (OpenAI, Claude, etc.)

### 2. Add Variables
Add to the same section:
- `LLM_API_ENDPOINT` = https://api.openai.com/v1/completions (or your provider's endpoint)

### 3. Create a PR
Make a PR with changes to the `force-app/` directory and watch the action run!

## 📦 Files Included

```
.github/
├── workflows/
│   └── salesforce-descript.yml              # Main workflow trigger
└── actions/
    └── salesforce-change-analyzer/
        ├── action.yml                        # Action definition
        └── analyze.js                        # Analysis engine
```

## 🔄 Using in Your Own Repo

Reference this action from any GitHub repository:

```yaml
- uses: Boljo/Descript/.github/actions/salesforce-change-analyzer@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    llm-api-key: ${{ secrets.LLM_API_KEY }}
    llm-api-endpoint: ${{ vars.LLM_API_ENDPOINT }}
    pr-number: ${{ github.event.pull_request.number }}
    repo-owner: ${{ github.repository_owner }}
    repo-name: ${{ github.event.repository.name }}
```

## 📋 Action Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `github-token` | ✓ | GitHub API token (use `${{ secrets.GITHUB_TOKEN }}`) |
| `llm-api-key` | ✓ | API key for LLM service (Secret) |
| `llm-api-endpoint` | ✓ | LLM API endpoint URL (Variable) |
| `target-org` | ✗ | Salesforce org name (default: `production`) |
| `pr-number` | ✓ | PR number (auto: `${{ github.event.pull_request.number }}`) |
| `repo-owner` | ✓ | Repo owner (auto: `${{ github.repository_owner }}`) |
| `repo-name` | ✓ | Repo name (auto: `${{ github.event.repository.name }}`) |

## 🤖 Supported LLM Providers

✅ **OpenAI** - GPT-4, GPT-3.5-turbo  
✅ **Azure OpenAI** - Enterprise deployments  
✅ **Anthropic Claude** - Claude-3 models  
✅ **Any REST API LLM** - Generic compatibility  

## 📊 Example Output

### PR Description Updated With:
```
## AI-Generated Change Summary
Modified ApexClass, CustomObject, Flow metadata. 
Total changes: 247 lines across 12 files. 
Includes new Account validation rules and refactored Apex batch process.
```

### PR Comment Added:
```
## Salesforce DevOps Analysis Report

### Change Summary
- Total Files: 12
- Lines Added: 180
- Lines Deleted: 67

### Metadata Types Modified
- ApexClass: 3 files
- CustomObject: 2 files
- Flow: 2 files
```

## 🔧 Configuration

See **[SALESFORCE_ACTION_SETUP.md](SALESFORCE_ACTION_SETUP.md)** for:
- Step-by-step setup guide
- LLM provider configuration (OpenAI, Azure, Claude)
- Customization options
- Troubleshooting guide

See **[EXAMPLE_WORKFLOWS.md](EXAMPLE_WORKFLOWS.md)** for:
- Minimal workflow setup
- Multi-org configurations
- Advanced use cases

## 📝 How It Works

The action performs these steps:

1. **Fetch PR Metadata** - Gets PR title, description, and list of changed files
2. **Analyze Salesforce Components** - Categorizes files by metadata type
3. **Generate Analysis** - Creates prompt with change details
4. **Call LLM API** - Sends analysis to configured LLM service
5. **Update PR Description** - Prepends AI summary to PR body
6. **Post Comment** - Adds detailed breakdown as PR comment

## 🔐 Security

- ✅ API keys stored as GitHub Secrets (never in logs)
- ✅ Read-only access to repository contents
- ✅ PR write permission scoped appropriately
- ✅ No external dependencies or third-party services (except LLM)

## 💡 Use Cases

- **Deployment Reviews** - Automated summary for release notes
- **Impact Analysis** - Quickly identify component dependencies
- **Audit Trail** - AI-generated documentation of changes
- **Team Collaboration** - Consistent change descriptions
- **DevOps Pipeline** - First-step validation in deployment pipeline

## 🛠️ Troubleshooting

**Action not running?**
- Check PR has changes in `force-app/` directory
- Verify workflow file exists in `main` branch
- Enable Actions in repo settings

**LLM API errors?**
- Verify `LLM_API_KEY` is set correctly
- Check `LLM_API_ENDPOINT` is valid
- Confirm API key has required permissions

**PR not updating?**
- Check `GITHUB_TOKEN` has PR write permission
- Review Actions logs for error details

See **[SALESFORCE_ACTION_SETUP.md](SALESFORCE_ACTION_SETUP.md)** for detailed troubleshooting.

## 📚 Learn More

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Salesforce DevOps Center](https://developer.salesforce.com/tools/vscode/en/user-guide/devops-center/)
- [Reusable Workflows Best Practices](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_id_usesuses)

## 🤝 Contributing

This is a public, reusable action. Feel free to fork, modify, or suggest improvements!

---

**Created for Salesforce DevOps Center Pipeline Integration** 🚀
