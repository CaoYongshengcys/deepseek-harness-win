# DeepSeek Harness Windows one-click launcher

English | [中文](README.zh.md)

This repository is the Windows one-click launcher edition of [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness). Double-click `dsh-web.bat` to start the Web UI.

## Requirements

- Windows 10/11
- [Node.js](https://nodejs.org) `^22.19 || >=24`
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- [Git](https://git-scm.com)

## Run

1. Clone the repository:

   ```sh
   git clone https://github.com/CaoYongshengcys/deepseek-harness-win.git
   cd deepseek-harness-win
   ```

2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Double-click `dsh-web.bat` and enter a port at the prompt (press Enter for the default `3080`).

Once the server is ready, `dsh web` opens the browser itself at the authenticated URL it prints (`http://127.0.0.1:<port>/?token=…`), so use that printed URL rather than the bare address. Before starting, the launcher probes the port: if it is occupied, the launcher prints the occupying process's PID, name, and command line — enter `r` to pick another port, or press Enter to exit.

4. Configure the API key: open **Settings → Models**, fill in the API key on the DeepSeek card, and save. The key is stored in `%USERPROFILE%\.dsh\.credentials.yaml` and never enters the repository.

Session data is stored in `%USERPROFILE%\.dsh`.

## Run from source

A source checkout runs the `dsh` CLI through tsx with no prior build:

```sh
pnpm install
pnpm dsh web                          # the Web UI
pnpm dsh --profile headless "task"    # one-shot task
```

Run every `dsh ...` command in the documentation from the repository root as `pnpm dsh ...`.

## Troubleshooting

- **Port occupied**: `dsh-web.bat` probes the port at launch and lists the occupying process (PID, name, command line); enter `r` to pick another port, or stop that process first.
- **`dsh web authentication required`**: the page was opened without its token. Reopen the `http://127.0.0.1:<port>/?token=…` URL that `dsh web` printed. Each launch mints a new token, so a tab left over from a previous run needs the current URL.
- **pnpm is not recognized**: reopen the terminal, or check that pnpm installed successfully.
- **Slow first launch**: tsx runs directly from source; no build step is required.

## Release notes

### v0.3.0-win (2026-10-07)

- Restored the per-row context menu in the workspace file tree (fork patch). When upstream migrated the tree from `ui-files` to `ui-sidebar-files`, the row-level menu was dropped, leaving only the header "Open workspace in app" button. The menu is back: directories open in File Explorer, files reveal their containing folder, both via `remote.session.openWorkspacePath` (files pass `action: 'reveal'`, which resolves to `explorer /select,<path>` on Windows). Unsupported row types do not show a menu.
- Synced `ui-sidebar-files` package docs (EN/ZH) and i18n pairing records; declared the new `@deepseek-ai/dsh-api-session-controller` injection and dependency. Verification: all 89 tests pass, client typecheck, oxlint, plus the five gates (client i18n / package structure / dependencies / export JSDoc / unknown assertions) and per-file 100% coverage on the package's `src`.
- Tagged as `v0.3.0-win`; full history in [CHANGELOG.md](CHANGELOG.md).

### v0.2.1-win (2026-10-06)

- Fixed launcher opening a bare URL that triggered `dsh web authentication required`. Removed the launcher-side port polling so `dsh web` owns browser launch with its authenticated URL.
- README (EN/ZH) updated to point users at the `?token=…` URL printed by `dsh web`; troubleshooting gained an entry for this 401 case.

### Earlier releases

See [CHANGELOG.md](CHANGELOG.md) for the complete history, including the upstream sync to `dsh-v0.2.1-alpha.1` (2026-10-04), headless token summary and launcher port picker (2026-10-03), and the initial import (2026-09-02).

## Upstream

Upstream development and documentation: [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness).

## License

[MIT](LICENSE)
