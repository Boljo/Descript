#!/usr/bin/env python3
import json
import os
import urllib.request
import anthropic

GITHUB_API = "https://api.github.com"

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY") or os.environ["INPUT_ANTHROPIC_API_KEY"])

with open(os.path.join(os.path.dirname(__file__), "system_prompt.md")) as _f:
    SYSTEM_PROMPT = _f.read().strip()


def main():
    token = os.environ["INPUT_GITHUB_TOKEN"]

    with open(os.environ["GITHUB_EVENT_PATH"]) as f:
        event = json.load(f)

    pr = event["pull_request"]
    repo = event["repository"]
    owner = repo["owner"]["login"]
    name = repo["name"]
    number = pr["number"]

    metadata = (
        f"- **Title:** {pr['title']}\n"
        f"- **Branch:** {pr['head']['ref']} → {pr['base']['ref']}\n"
        f"- **Files changed:** {pr.get('changed_files', '?')}\n"
        f"- **+{pr.get('additions', 0)} / -{pr.get('deletions', 0)} lines**"
    )

    diff_url = f"{GITHUB_API}/repos/{owner}/{name}/pulls/{number}/files"
    req = urllib.request.Request(diff_url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "pr-analyzer",
    })
    with urllib.request.urlopen(req) as resp:
        files = json.loads(resp.read())

    diff = "\n\n".join(f"--- {f['filename']} ---\n{f.get('patch', '(binary)')}" for f in files)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"{metadata}\n\n```\n{diff[:80000]}\n```"}],
    )

    body = f"🤖 **Automated PR Analysis**\n\n{message.content[0].text}"

    url = f"{GITHUB_API}/repos/{owner}/{name}/issues/{number}/comments"
    req = urllib.request.Request(url, data=json.dumps({"body": body}).encode(), headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "pr-analyzer",
    }, method="POST")
    with urllib.request.urlopen(req) as resp:
        print(f"Commented: HTTP {resp.status}")


if __name__ == "__main__":
    main()
