# dsh-credentials-memory

[English](README.md) | 中文

内存型 [凭据](../credentials/README.md) 提供方：经由 seam 写入的值只存活于进程地址空间内。不读取也不写入磁盘，因此部署镜像、profile 目录或进程退出后抓取的转储都不会携带本进程获知的任何密钥。

在「模型」页输入的 key 会在下一次请求时生效，进程退出即丢失——操作者每次启动都要重新输入。没有环境回退，也没有 `.env` 层：本提供方服务于「任何密钥都不应能从文件系统或启动环境中读到」的部署。需要文件/环境分层时改挂 `dsh-credentials-local`。

## Config

无字段。提供方不读取任何外部资源；空 config 无需解析任何内容。

## Source id

`memory`——由 `describe()` 在 `configured: true, writable: true` 旁报告。`resolve()` 在未存入值时返回 `undefined`，因此消费方适配器在操作者输入之前会把该凭据视为未配置。

## 何时用本提供方替代 `dsh-credentials-local`

- 发布到外网的 web 部署，镜像与 `$DSH_HOME` 必须不含任何密钥。
- 操作者将在运行时输入 key、且启动环境不得携带该 key 的任何运行。

CLI/CI 运行若从环境或 `$DSH_HOME/.credentials.yaml` 读取 key，仍默认使用 `dsh-credentials-local`。

## Model Experience

无；本包不涉及任何模型行为。

#### KV Cache effect

无；本包既不组装也不发送提供方请求。

## Known Limitations and Deferred Work

- **重启后不持久**——设计如此；依赖本提供方的部署每次启动都要重新输入 key。
- **无环境回退**——启动环境或 `.env` 中的 key 不会被读取；需要该分层时改挂 `dsh-credentials-local`。
