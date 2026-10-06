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

## Upstream

Upstream development and documentation: [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness).

## License

[MIT](LICENSE)
