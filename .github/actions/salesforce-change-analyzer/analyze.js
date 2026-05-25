#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_ENDPOINT = process.env.LLM_API_ENDPOINT;
const TARGET_ORG = process.env.TARGET_ORG;
const PR_NUMBER = process.env.PR_NUMBER;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

/**
 * Fetch PR details from GitHub API
 */
async function fetchPRDetails() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Salesforce-DevOps-Action'
      }
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse PR details: ${e.message}`));
        }
      });
    }).on('error', reject).end();
  });
}

/**
 * Get changed files in the PR
 */
async function getChangedFiles() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}/files?per_page=100`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Salesforce-DevOps-Action'
      }
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse changed files: ${e.message}`));
        }
      });
    }).on('error', reject).end();
  });
}

/**
 * Analyze Salesforce metadata changes
 */
async function analyzeSalesforceChanges(files) {
  const analysis = {
    total_changes: files.length,
    additions: 0,
    deletions: 0,
    modifications: 0,
    metadata_types: {},
    files_by_type: [],
    summary_points: []
  };

  for (const file of files) {
    analysis.additions += file.additions || 0;
    analysis.deletions += file.deletions || 0;

    // Categorize by status
    if (file.status === 'added') analysis.modifications++;
    else if (file.status === 'modified') analysis.modifications++;
    else if (file.status === 'removed') analysis.deletions++;

    // Extract metadata type
    const match = file.filename.match(/force-app\/main\/default\/(\w+)\//);
    if (match) {
      const metadataType = match[1];
      analysis.metadata_types[metadataType] = (analysis.metadata_types[metadataType] || 0) + 1;
      analysis.files_by_type.push({
        type: metadataType,
        file: file.filename,
        changes: file.changes,
        status: file.status
      });
    }
  }

  // Generate summary points
  const types = Object.keys(analysis.metadata_types);
  if (types.length > 0) {
    analysis.summary_points.push(`Modified ${types.join(', ')} metadata`);
  }
  analysis.summary_points.push(`Total changes: ${analysis.additions + analysis.deletions} lines`);

  return analysis;
}

/**
 * Call LLM API to summarize changes
 */
async function callLLMAPI(analysisData, prTitle, prBody) {
  return new Promise((resolve, reject) => {
    const prompt = generatePrompt(analysisData, prTitle, prBody);
    
    const requestBody = JSON.stringify({
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.7
    });

    const url = new URL(LLM_API_ENDPOINT);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'User-Agent': 'Salesforce-DevOps-Action'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.choices?.[0]?.text || response.summary || data);
        } catch (e) {
          reject(new Error(`Failed to parse LLM response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * Generate prompt for LLM
 */
function generatePrompt(analysisData, prTitle, prBody) {
  const metadataTypes = Object.entries(analysisData.metadata_types)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');

  return `Analyze these Salesforce metadata changes and provide a concise summary:

PR Title: ${prTitle}
PR Description: ${prBody || 'No description provided'}

Changes Summary:
- Metadata types modified: ${metadataTypes}
- Total files changed: ${analysisData.total_changes}
- Lines added: ${analysisData.additions}
- Lines deleted: ${analysisData.deletions}

Changed files:
${analysisData.files_by_type.slice(0, 10).map(f => `- ${f.file} (${f.status})`).join('\n')}

Please provide a 2-3 sentence technical summary of these Salesforce metadata changes, suitable for deployment notes.`;
}

/**
 * Update PR description with LLM summary
 */
async function updatePRDescription(summary) {
  return new Promise((resolve, reject) => {
    const updatedBody = `## AI-Generated Change Summary\n${summary}\n\n---\n\n${process.env.ORIGINAL_PR_BODY || ''}`;
    
    const requestBody = JSON.stringify({
      body: updatedBody
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        'User-Agent': 'Salesforce-DevOps-Action'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to update PR: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * Add comment to PR with detailed analysis
 */
async function addAnalysisComment(analysisData, llmSummary) {
  return new Promise((resolve, reject) => {
    const comment = `## Salesforce DevOps Analysis Report

### Change Summary
- **Total Files**: ${analysisData.total_changes}
- **Lines Added**: ${analysisData.additions}
- **Lines Deleted**: ${analysisData.deletions}

### Metadata Types Modified
${Object.entries(analysisData.metadata_types)
  .map(([type, count]) => `- **${type}**: ${count} file(s)`)
  .join('\n')}

### AI-Generated Deployment Notes
${llmSummary}

### Files Changed
${analysisData.files_by_type.slice(0, 15)
  .map(f => `- \`${f.file}\` (${f.status}, ${f.changes} changes)`)
  .join('\n')}

---
*Analysis generated by Salesforce DevOps GitHub Action*`;

    const requestBody = JSON.stringify({ body: comment });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues/${PR_NUMBER}/comments`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        'User-Agent': 'Salesforce-DevOps-Action'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to add comment: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Salesforce change analysis...');

    // Fetch PR details
    console.log('📋 Fetching PR details...');
    const prDetails = await fetchPRDetails();
    process.env.ORIGINAL_PR_BODY = prDetails.body || '';

    // Get changed files
    console.log('📂 Analyzing changed files...');
    const files = await getChangedFiles();

    if (files.length === 0) {
      console.log('ℹ️  No files changed in this PR');
      return;
    }

    // Analyze Salesforce changes
    console.log('🔍 Analyzing Salesforce metadata...');
    const analysis = await analyzeSalesforceChanges(files);

    // Call LLM API
    console.log('🤖 Generating AI summary...');
    const llmSummary = await callLLMAPI(analysis, prDetails.title, prDetails.body);

    // Update PR description
    console.log('✏️  Updating PR description...');
    await updatePRDescription(llmSummary);

    // Add detailed comment
    console.log('💬 Adding analysis comment...');
    await addAnalysisComment(analysis, llmSummary);

    console.log('✅ Analysis complete!');
    console.log('\n📊 Summary:');
    console.log(`   Files changed: ${analysis.total_changes}`);
    console.log(`   Lines added: ${analysis.additions}`);
    console.log(`   Lines deleted: ${analysis.deletions}`);
    console.log(`   Metadata types: ${Object.keys(analysis.metadata_types).join(', ')}`);

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  }
}

main();
