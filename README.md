# Open Problems Board

A zero-backend board for posting and browsing unsolved problems, powered entirely by GitHub Issues and GitHub Pages.

## Quick start

1. Click the green **Use this template** / **Fork** button or clone the repo.
2. Replace `<user>` in **docs/index.html** and **docs/main.js** with *your* GitHub username.
3. Enable **GitHub Pages → Source → `/docs` folder**.
4. Visit `https://<user>.github.io/unsolved-problems/`.

## How it works

* New problems are submitted through an **Issue Form** (`.github/ISSUE_TEMPLATE/problem.yml`).
* Each problem is an issue labeled `unsolved`.
* The static site (`docs/`) fetches open issues via the GitHub REST API and groups them by
  category client‑side—no servers or databases needed.

Enjoy!
