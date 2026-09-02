# Agent Note: Web 工作区文件浏览器

Status: implemented

[English](2026-08-18-web-workspace-file-browser.md) | 中文

## 问题

Web 界面此前没有办法看到工作目录下的文件：侧边栏按工作区分组列出会话，但没有任何入口暴露目录内容，用户只能让 agent 执行 `ls` 才知道里面有什么。directory-picker 缝隙虽然已经能列目录，但只列目录、且只用于挑选工作区根目录——它不是文件浏览器，而且其 `browse` 能力并非总是挂载（有原生显示器的部署会用原生选择器）。

## 决定

**新增只读原语 `host.listFiles`，列出一层目录的文件与子目录。** 它与 `listDirectory` 并列放在现有 `HostApi` 上，但不像后者那样受 directory-picker `browse` 能力门控，而是始终提供：这是与 `openPath` 类似的只读列表，若加门控，文件浏览器恰恰会在最常运行 Web UI 的原生显示部署上消失。缺省路径时列出宿主进程工作目录——与 `session.create` 的落点一致——因此文件树与未指定 cwd 的会话落点相符。条目先目录后文件，各组按名称排序；隐藏条目由宿主标记而非剔除，是否显示由客户端决定。每层受网关配置项 `listFilesMaxEntries` 上限约束（默认 1000，与 directory-picker browse 默认一致），被截断时以 `truncated` 标记。

**客户端通过现有 workspaces 服务暴露。** `ctx.workspaces.listFiles(path?, signal?)` 与 `listDirectory`/`createDirectory`/`openPath` 并列封装该 wire 调用；`FileListing`/`FileEntry` 类型沿用现有 apiproxy → connection → api-remotes 再导出链。

**新增 `ui-files` 客户端插件，以常驻侧边栏面板呈现。** ui-sidebar 在 `sidebar.workspaces` 旁声明 `sidebar.files` 单插槽，并在浏览区域上方提供仅宽屏显示的「会话/文件」视图切换；外壳渲染二者之一（窄栏始终显示会话列表）。`FilesPanel` 注册进 `sidebar.files`，以懒加载文件树填满该区域：挂载时加载根层级，展开目录时按需扫描，加载/空目录/失败/截断状态在所属层级内联显示。隐藏条目不出现在树中。目标插槽由 ui-sidebar 声明，因此 `apply` 使用 `slots.inject()` 在其声明生命周期内注册。

**文件树以所选工作区为根。** `FilesPanel` 通过全局 `useSessions` 标准套件读取当前会话，并列出其 `cwd`——即工作区据以命名的文件夹——因此选定工作区后切换到「文件」即显示该文件夹内容。无当前会话时回退到缺省路径列表（宿主工作目录）。当前会话变化时重新生根。

## 考虑的替代方案

**扩展 directory-picker `browse` 能力以返回文件。** 否决：该缝隙的契约刻意只列目录、用于挑选工作区，且在原生显示部署上不挂载，会让文件浏览器在那里消失。

**由底部入口打开的弹窗。** 否决，改用常驻面板：浏览工作区应像浏览文件夹一样，一键切换即可到达，而非临时对话框。面板复用外壳既有的区域几何，折叠/窄栏行为不受影响——窄栏仍显示会话列表。

**仅以宿主工作目录为根。** 否决：选定工作区后应显示该文件夹的文件，而当前会话的 `cwd` 正是它；宿主 cwd 仅作为无会话时的回退。

## 后果

`host.listFiles` 是新的 wire 方法，因此每个 `HostApi` 测试替身与 fixture carrier 都实现了它。ui-sidebar 新增 `sidebar.files` 插槽与「会话/文件」视图切换，其渲染输出（及快照）随之带有该切换。文件浏览器只读；在系统中显示/打开、自由路径输入、隐藏条目开关均推迟（记录在该包 README 的 Known Limitations）。
