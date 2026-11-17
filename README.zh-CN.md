# git-account-manager（gam）

用「每账号独立 SSH 密钥」管理多个 git 账号——把每个仓库绑定到正确的账号，commit 与 push 永远用对身份。

一台机器、多套账号（个人 + 工作，GitHub + Gitee + 公司自建 GitLab），不想手动来回切 `git config`、更怕用错身份推代码，`gam` 就是为此而生。

[English](README.md)

## 工作原理

注册每个账号时，`gam` 负责：

1. 生成一把**专属 SSH 密钥**（`~/.ssh/gacc_<账号名>`，ed25519）
2. 在 `~/.ssh/config` 的**标记管理块**内写入一个 Host 别名

```ssh-config
# >>> gam >>> do not edit; managed by git-account-manager
Host github-muzi
    HostName github.com
    User git
    IdentityFile C:\Users\you\.ssh\gacc_muzi
    IdentitiesOnly yes
# <<< gam <<<
```

在仓库里执行 `gam use <账号>` 后：

- 写入仓库级 `user.name` / `user.email`（提交带上正确身份）
- 把 remote 地址改写为别名形式：`https://github.com/org/repo.git` → `git@github-muzi:org/repo.git`

所有绑定信息都存在仓库自己的 `.git/config` 里（该文件不会随仓库传播），开源仓库零污染；协作者 clone 后绑定自己的账号即可。

```
git push ──► git@github-muzi:org/repo.git
                │
                ▼  ~/.ssh/config
        IdentityFile gacc_muzi  ──►  以个人账号完成认证
```

## 安装

需要 Node.js ≥ 20.12 与 `ssh`/`ssh-keygen`（macOS、Linux、Windows Git Bash 均内置）。

```bash
npm install -g git-account-manager
```

## 快速上手

```bash
# 1. 注册账号（终端里交互式；自动生成 ed25519 密钥）
gam add

# 2. 把打印出的公钥添加到平台
#    （GitHub → Settings → SSH and GPG keys）

# 3. 验证认证
gam test muzi

# 4. 绑定仓库
cd my-project
gam use muzi

# my-project 里的所有提交与推送现在都用 "muzi"
```

再注册第二个账号（比如工作号），把其他仓库绑给它——完成。全程不碰全局配置。

## 子命令

| 命令 | 说明 |
|---|---|
| `gam add` | 注册账号；生成或导入 SSH 密钥。选项：`-n/--name`、`-e/--email`、`-g/--git-name`、`-p/--platform <github\|gitee\|gitlab\|custom>`、`-H/--host`、`--port`、`-k/--key <路径>`（导入已有密钥）。终端里省略选项即进入交互模式。 |
| `gam list` | 列出账号（别名、密钥路径、绑定仓库数）。 |
| `gam use <账号>` | 绑定当前仓库：写入仓库级 `user.name`/`user.email` 并改写 remote URL（`--remote <名字>` 指定 remote，默认 `origin`）。 |
| `gam current` | 显示当前仓库绑定的账号。 |
| `gam pub <账号>` | 打印公钥（复制到平台添加）。 |
| `gam test <账号>` | 通过别名验证平台认证。 |
| `gam remove <账号>` | 移除账号配置。默认保留密钥文件；`--purge` 才删（需确认，脚本中加 `--yes`）。 |

`github`、`gitee`、`gitlab` 平台内置默认主机名；`custom` 覆盖公司自建 Git 服务（任意主机、可选端口）。

## 数据与文件

| 路径 | 用途 |
|---|---|
| `~/.git-account-manager/accounts.json` | 账号台账 + 各账号绑定了哪些仓库（仅记录） |
| `~/.ssh/gacc_<账号名>`、`.pub` | 每账号密钥对 |
| `~/.ssh/config` | 只管理 `# >>> gam >>> … # <<< gam <<<` 标记块；其余内容永不改动，且每次修改前先备份 `config.bak` |
| 仓库 `.git/config` | 绑定本体：仓库级用户 + 改写后的 remote URL |

## 常见问题

**gam 会改我的全局 git 身份吗？**
不会。只写仓库级配置，全局 `user.name`/`user.email` 原样不动。

**队友 clone 我的仓库会怎样？**
`.git/config` 不属于仓库内容。他们拿到的是正常 remote 地址，用自己的 `gam use` 绑定自己的账号。

**想把 remote 改回 HTTPS？**
`git remote set-url origin https://github.com/org/repo.git`，或者换一个账号重新 `gam use`。

**生成的密钥有 passphrase 吗？**
默认没有（开发机惯例）。随时可以加固：`ssh-keygen -p -f ~/.ssh/gacc_<账号名>`，配合 `ssh-agent` 使用。

**某个仓库显示绑定了已删除的账号？**
`gam remove` 会特意列出受影响仓库：在里面重新 `gam use <其他账号>` 即可修复 remote。

## 许可证

[MIT](LICENSE)
