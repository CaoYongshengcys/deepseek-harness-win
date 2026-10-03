# 更新记录

本仓库是 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 的 Windows 一键启动版，此文件记录本仓库自身的更新；上游变更以导入时的版本为准。

## 2026-10-03

- headless 运行（`pnpm dsh --profile headless "task"`）结束后在 stderr 打印一行本次运行的 token 用量摘要（input / output / cache read / cache write / total）；本次运行没有累计用量时不打印。
- `dsh-web.bat` 启动器改进：启动时提示输入端口（直接回车使用默认 `3080`）；启动前检查端口占用，若被占用则列出占用进程的 PID、名称与命令行，可输入 `r` 换端口重试；浏览器改为等端口就绪后再自动打开，避免落在"拒绝连接"页。端口交互逻辑放在新增的 `dsh-web.ps1` 中。
- README、CLI reference 与 headless 包文档（中英文）同步上述变化。

## 2026-09-02

- README 改为通过 Web UI（设置 → 模型）配置 API Key，密钥保存在 `%USERPROFILE%\.dsh\.credentials.yaml`，不再使用 `.env`。
- 新增 Windows 一键启动脚本 `dsh-web.bat`，README 围绕一键启动重写。
- 导入 deepseek-harness 源码。
