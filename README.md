# DeepSeek Harness Windows 一键启动

本仓库是 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 的 Windows 一键启动版。双击 `dsh-web.bat` 即可启动 Web UI。

## 环境要求

- Windows 10/11
- [Node.js](https://nodejs.org) `^22.19 || >=24`
- [pnpm](https://pnpm.io)（`npm install -g pnpm`）
- [Git](https://git-scm.com)

## 使用步骤

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

服务就绪后浏览器会自动打开 Web UI（`http://127.0.0.1:<端口>`）。启动前会先检查该端口：若已被占用，会打印占用进程的 PID、名称与命令行，此时输入 `r` 换一个端口，或直接回车退出。

4. 配置 API Key：打开 **设置 → 模型**，在 DeepSeek 卡片中填入 API Key 并保存。密钥保存在 `%USERPROFILE%\.dsh\.credentials.yaml`，不会进入仓库。

会话数据保存在 `%USERPROFILE%\.dsh`。

## 常见问题

- **端口被占用**：`dsh-web.bat` 启动时会检查端口并列出占用进程（PID、名称、命令行）；输入 `r` 换一个端口，或先结束那个进程。
- **pnpm 不是内部命令**：重新打开终端，或检查 pnpm 是否安装成功。
- **首次启动较慢**：tsx 直接从源码启动，无需预先 build。

## 上游项目

上游开发与文档见 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)。

## 许可证

[MIT](LICENSE)
