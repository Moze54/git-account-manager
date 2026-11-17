# git-account-manager

Manage multiple git accounts with per-account SSH keys — bind each repo to the right account, so commits and pushes always use the identity you intend.

`gam` answers a common pain: one machine, several accounts (personal + work, GitHub + Gitee + a self-hosted GitLab), and no desire to juggle `git config` by hand or accidentally push with the wrong identity.

[中文文档](README.zh-CN.md)

## How it works

For every account you register, `gam` keeps:

1. a **dedicated SSH key** (`~/.ssh/gacc_<name>`, ed25519)
2. a **Host alias** in `~/.ssh/config` (inside a clearly marked managed block)

```ssh-config
# >>> gam >>> do not edit; managed by git-account-manager
Host github-muzi
    HostName github.com
    User git
    IdentityFile C:\Users\you\.ssh\gacc_muzi
    IdentitiesOnly yes
# <<< gam <<<
```

`gam use <account>` inside a repo then:

- sets repo-local `user.name` / `user.email` (commits carry the right identity)
- rewrites the remote URL to the alias form: `https://github.com/org/repo.git` → `git@github-muzi:org/repo.git`

Everything is stored in the repo's own `.git/config` — which never leaves your machine — so open-source repos stay clean, and collaborators simply bind their own accounts.

```
git push ──► git@github-muzi:org/repo.git
                │
                ▼  ~/.ssh/config
        IdentityFile gacc_muzi  ──►  authenticates as your personal account
```

## Install

Requires Node.js ≥ 20.12 and `ssh`/`ssh-keygen` (preinstalled on macOS, Linux, and Git Bash on Windows).

```bash
npm install -g @mzbo/git-account-manager
```

## Quick start

```bash
# 1. register an account (interactive; generates an ed25519 key)
gam add

# 2. add the printed public key to your platform
#    (GitHub → Settings → SSH and GPG keys)

# 3. verify authentication
gam test muzi

# 4. bind a repo
cd my-project
gam use muzi

# every commit & push in my-project now uses "muzi"
```

Register a second account (e.g. work) and bind other repos to it — done. No global config is ever touched.

## Commands

| Command | Description |
|---|---|
| `gam add` | Register an account; generates or imports an SSH key. Options: `-n/--name`, `-e/--email`, `-g/--git-name`, `-p/--platform <github\|gitee\|gitlab\|custom>`, `-H/--host`, `--port`, `-k/--key <path>` (import existing key). Omit options in a terminal for interactive mode. |
| `gam list` | List accounts with alias, key path and bound repo count. |
| `gam use <account>` | Bind the current repo: writes local `user.name`/`user.email` and rewrites the remote URL (`--remote <name>` to pick a remote, default `origin`). |
| `gam current` | Show which account the current repo is bound to. |
| `gam pub <account>` | Print the public key to paste into your platform. |
| `gam test <account>` | Verify platform authentication through the alias. |
| `gam remove <account>` | Remove the account's config. Key files are kept unless `--purge` (which asks for confirmation; add `--yes` in scripts). |

Platforms `github`, `gitee` and `gitlab` come with sensible host defaults; `custom` covers self-hosted git servers (any host, optional port).

## Data & files

| Path | Purpose |
|---|---|
| `~/.git-account-manager/accounts.json` | account registry + which repos are bound to each account (bookkeeping only) |
| `~/.ssh/gacc_<name>`, `.pub` | per-account key pair |
| `~/.ssh/config` | only the marked `# >>> gam >>> … # <<< gam <<<` block is managed; the rest is untouched, and a `config.bak` backup is written before every change |
| repo `.git/config` | the binding itself: local user + rewritten remote URL |

## FAQ

**Does `gam` change my global git identity?**
No. It only writes repo-local config. Your global `user.name`/`user.email` stay exactly as they are.

**What happens when a teammate clones my repo?**
`.git/config` is not part of the repo. They get a normal remote URL and bind their own account with `gam use`.

**I want HTTPS remotes back.**
`git remote set-url origin https://github.com/org/repo.git` — or re-run `gam use` with a different account.

**Are generated keys passphrase-protected?**
By default no (typical for dev machines). Harden one anytime: `ssh-keygen -p -f ~/.ssh/gacc_<name>` and use `ssh-agent`.

**A repo shows as bound to a removed account?**
`gam remove` warns about bound repos on purpose: re-run `gam use <other-account>` there to fix the remote.

## License

[MIT](LICENSE)
