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

3. 双击 `dsh-web.bat`。

浏览器会在几秒后自动打开 Web UI（默认地址 `http://127.0.0.1:3080`）。

4. 配置 API Key：打开 **设置 → 模型**，在 DeepSeek 卡片中填入 API Key 并保存。密钥保存在 `%USERPROFILE%\.dsh\.credentials.yaml`，不会进入仓库。

会话数据保存在 `%USERPROFILE%\.dsh`。

## 常见问题

- **端口被占用**：确认 3080 端口未被其他程序占用。
- **pnpm 不是内部命令**：重新打开终端，或检查 pnpm 是否安装成功。
- **首次启动较慢**：tsx 直接从源码启动，无需预先 build。

## 上游项目

上游开发与文档见 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)。

## 许可证

[MIT](LICENSE)
