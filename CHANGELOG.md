# 更新记录

本仓库是 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 的 Windows 一键启动版，此文件记录本仓库自身的更新；上游变更以导入时的版本为准。

## 2026-10-06

- 修复启动器打开的页面报 `dsh web authentication required`：`dsh-web.ps1` 原先自行轮询端口、就绪后打开不带访问令牌的裸地址 `http://127.0.0.1:<端口>`，而 Web UI 的鉴权只接受带 `?token=…` 的地址（用于换发按 `host:port` 绑定的持久 cookie）或已存在的该 cookie。新端口两者都没有，必然 401。
- 该轮询还与 `dsh web` 自身的浏览器交接冲突：后者在插件树 settle 之后才用带令牌的地址打开默认浏览器，时机更准；轮询只等 TCP accept，总是先落地那个 401 页面。现已删除启动器侧的轮询，浏览器打开完全交由 `dsh web` 负责。
- 现象此前呈"时好时坏"，原因是 cookie 按 `127.0.0.1:<端口>` 绑定且持久 30 天：某端口只要成功打开过一次带令牌的地址，之后裸地址也能凭 cookie 通过；换新端口、清除 cookie，或进程重启前从未打开过令牌地址时才会触发。令牌本身是每进程一份，重启后旧地址即失效。
- README（中英文）同步：运行章节改为说明使用 `dsh web` 打印的带令牌地址，常见问题新增该 401 的处理条目。

## 2026-10-04

- 同步上游至 [dsh-v0.2.1-alpha.1](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.1)（上游 2026-10-03 发布，跨越 0.1.5 → 0.1.6 → 0.1.7 → 0.2.0 → 0.2.1 五条版本线）。同步方式为整树快照导入 + 重放全部 fork 改动；上游的符号链接条目按本机 git 语义物化为内容为目标路径的普通文件。
- 上游新基线要点：headless 新增 `--json` 事件流与 `--session-id` 会话续用，默认模式把提供方 reasoning 流式写入 stderr（`dsh: reasoning:` 段）；新增 desktop 应用（apps/desktop）；移除 runtime invariant 插件体系；i18n 配对记录改为按章节哈希；期望输出测试重组到 `apps/cli/tests/profiles/`，golden 移至仓库根 `snapshots/`；vendor Cordis 升至 4.0.5-alpha.1。
- 重放 fork 改动：Windows 一键启动器（`dsh-web.bat` / `dsh-web.ps1`）、双语启动器 README（保留 `## Run` / `## Run from source` 锚点）、headless token 用量汇总（适配新 runner：与 reasoning 流共存、覆盖 `--json` 模式，goldens 与 built-bin 断言同步更新；单元测试 50/50，built-bin 与 product-profile 的 json 投影 / activation-error / 模型失败场景在本机通过）、CHANGELOG。
- Windows 测试适配（按新测试树重放）：loader-smoke 默认进程超时 30s→90s（fork 本地单点常量，本机全产品源码启动实测 25-80s）；dsh-badge 资源路径标记化改用 JSON 转义形式；badge/goal 子进程抑制 node:sqlite 实验特性警告；built-bin headless mock 保持 repeatLast 以消除会话标题生成竞态；`runs one task` product-profile 用例在 win32 跳过（其会话 golden 只有 POSIX bash 版本，无 pwsh 变体），dsh-badge 用例在 win32 跳过（Windows 额外捆绑 diagnose-windows-sandbox-acl 技能，内联快照钉的是 POSIX 名册）。上游新版 cli-mock 在 win32 自动改用 pwsh 工具，goal 场景在本机直接通过。
- 验证口径：typecheck 全量构建、受影响用例（headless 单元/built-bin/product-profile 组/goal/badge）、doc-sync 全部门禁。新基线的全量期望/快照套件未在本机整体跑完，旧基线的 jsonrpc SDK 与 ACP 场景 Windows 回放缺口在新基线的状态未逐一验证。

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
