# 更新记录

本仓库是 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 的 Windows 一键启动版，此文件记录本仓库自身的更新；上游变更以导入时的版本为准。

## 2026-10-03

- headless 运行（`pnpm dsh --profile headless "task"`）结束后在 stderr 打印一行本次运行的 token 用量摘要（input / output / cache read / cache write / total）；本次运行没有累计用量时不打印。
- `dsh-web.bat` 启动器改进：启动时提示输入端口（直接回车使用默认 `3080`）；启动前检查端口占用，若被占用则列出占用进程的 PID、名称与命令行，可输入 `r` 换端口重试；浏览器改为等端口就绪后再自动打开，避免落在"拒绝连接"页。端口交互逻辑放在新增的 `dsh-web.ps1` 中。
- README、CLI reference 与 headless 包文档（中英文）同步上述变化。
- 根 README 重组为规范的双语文档对：英文 `README.md` + 中文 `README.zh.md`，并恢复用户文档链接所需的 `## Run` / `## Run from source` 章节锚点。
- 修复仓库文档门禁：补录 ui-files、credentials-memory 与 web-workspace-file-browser 笔记的翻译配对记录，config-catalog 中文侧同步生成器输出，补齐 ui-files 与 credentials-memory 的模型体验（Model Experience）审计条目，重新生成过期的 config/client 目录与组合图谱。
- Windows 测试适配：依赖 `bash` 工具的 product-profile 快照在 win32 上跳过（dsh-base 在 Windows 按设计禁用 bash 栈、挂载 tool-pwsh）；product-profile 模型失败快照与 dsh-badge 快照的进程超时从 30s 放宽到 90s（本机全产品源码启动实测 30-80s）；built-bin headless e2e 的 mock 改为可重复的 success 行为，消除会话标题生成请求与主回合请求的竞态；dsh-badge 的资源路径标记化改用 JSON 转义形式（Windows 路径在原始 JSON 文本中反斜杠加倍，原替换永不命中）；goal 与 dsh-badge 快照在子进程环境中抑制 node:sqlite 的实验特性警告（警告携带子进程 PID，无法钉进空 stderr 断言）；翻译提示词快照随 README 变化重录。
- 已知遗留（Windows 特有的 fixture 回放缺口，快照回放按仓库策略只要求在 macOS/Linux 成立，Windows 信号由 CI 承担）：jsonrpc SDK 快照 4 个场景在物化 fixture 时对 `{{cwd}}` 做裸替换，Windows 路径产生非法 JSON 转义；ACP 快照 6 个场景的会话日志归一化未覆盖 Windows 路径形态。
- 测试环境要求：依赖 bash 的快照 fixture 需要 Git Bash 位于 PATH（例如把 `C:\Program Files\Git\bin` 加入用户 PATH）。

## 2026-09-02

- README 改为通过 Web UI（设置 → 模型）配置 API Key，密钥保存在 `%USERPROFILE%\.dsh\.credentials.yaml`，不再使用 `.env`。
- 新增 Windows 一键启动脚本 `dsh-web.bat`，README 围绕一键启动重写。
- 导入 deepseek-harness 源码。
