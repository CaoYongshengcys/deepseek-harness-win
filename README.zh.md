# DeepSeek Harness Windows 一键启动

[English](README.md) | 中文

本仓库是 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 的 Windows 一键启动版。双击 `dsh-web.bat` 即可启动 Web UI。

## 环境要求

- Windows 10/11
- [Node.js](https://nodejs.org) `^22.19 || >=24`
- [pnpm](https://pnpm.io)（`npm install -g pnpm`）
- [Git](https://git-scm.com)

<a id="run"></a>

## 运行

1. 克隆仓库：

   ```sh
   git clone https://github.com/CaoYongshengcys/deepseek-harness-win.git
   cd deepseek-harness-win
   ```

2. 安装依赖：

   ```sh
   pnpm install
   ```

3. 双击 `dsh-web.bat`，按提示输入端口（直接回车使用默认 `3080`）。

服务就绪后，`dsh web` 会自行打开浏览器，地址是它打印出来的那个带访问令牌的 URL（`http://127.0.0.1:<端口>/?token=…`），请使用打印出的地址，而不是不带令牌的裸地址。启动前会先检查该端口：若已被占用，会打印占用进程的 PID、名称与命令行，此时输入 `r` 换一个端口，或直接回车退出。

4. 配置 API Key：打开 **设置 → 模型**，在 DeepSeek 卡片中填入 API Key 并保存。密钥保存在 `%USERPROFILE%\.dsh\.credentials.yaml`，不会进入仓库。

会话数据保存在 `%USERPROFILE%\.dsh`。

<a id="run-from-source"></a>

## 从源码运行

源码检出通过 tsx 直接运行 `dsh` CLI，无需预先 build：

```sh
pnpm install
pnpm dsh web                          # the Web UI
pnpm dsh --profile headless "task"    # one-shot task
```

文档中的每条 `dsh ...` 命令都在仓库根目录以 `pnpm dsh ...` 的形式运行。

## 常见问题

- **端口被占用**：`dsh-web.bat` 启动时会检查端口并列出占用进程（PID、名称、命令行）；输入 `r` 换一个端口，或先结束那个进程。
- **`dsh web authentication required`**：页面是在没有访问令牌的情况下打开的。重新打开 `dsh web` 打印的 `http://127.0.0.1:<端口>/?token=…` 地址。每次启动都会生成新的令牌，因此上一次运行遗留的标签页需要改用当前地址。
- **pnpm 不是内部命令**：重新打开终端，或检查 pnpm 是否安装成功。
- **首次启动较慢**：tsx 直接从源码启动，无需预先 build。

## 上游项目

上游开发与文档见 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)。

## 许可证

[MIT](LICENSE)
