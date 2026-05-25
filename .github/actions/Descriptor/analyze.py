#!/usr/bin/env python3
import json
import os
import urllib.request

GITHUB_API = "https://api.github.com"


def main():
    token = os.environ["INPUT_GITHUB-TOKEN".replace("-", "_")]  # INPUT_GITHUB_TOKEN

    with open(os.environ["GITHUB_EVENT_PATH"]) as f:
        event = json.load(f)

    pr = event["pull_request"]
    repo = event["repository"]
    owner = repo["owner"]["login"]
    name = repo["name"]
    number = pr["number"]

    body = (
        f"## PR Analysis\n"
        f"- **Title:** {pr['title']}\n"
        f"- **Files changed:** {pr.get('changed_files', '?')}\n"
        f"- **+{pr.get('additions', 0)} / -{pr.get('deletions', 0)} lines**"
    )

    url = f"{GITHUB_API}/repos/{owner}/{name}/issues/{number}/comments"
    req = urllib.request.Request(
        url,
        data=json.dumps({"body": body}).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "pr-analyzer",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        print(f"Commented: HTTP {resp.status}")


#test

if __name__ == "__main__":
    main()