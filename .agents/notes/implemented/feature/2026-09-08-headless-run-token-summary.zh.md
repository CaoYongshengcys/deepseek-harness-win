# Agent Note: Headless run token summary

Status: implemented

[English](2026-09-08-headless-run-token-summary.md) | 中文

## 问题

`dsh --profile headless` 此前只打印最终 assistant 文本然后退出，没有任何东西告诉操作者这次运行花了多少。token-meter 早已把全日志的提供方用量折算进 `tokenUsage` 会话投影，Web 聊天统计行也读取它，但真正被脚本与 CI 使用的一次性 surface 没有读取它，因此要回答「这次运行用了多少 token」只能手工打开持久化的会话日志。

## 决定

**runner 在请求退出前向 stderr 写出一行汇总：**`dsh: tokens: input N, output N, cache read N, cache write N, total N`。它经可选的 `ctx.sessionProjections` 注册表读取 token-meter 的全日志 `tokenUsage` 投影，因此 stdout 仍然只承载答案本身，管道与 `$(...)` 捕获都不受影响。

**四个桶按投影所载原样打印，绝不在组合包里重新折算。** 该投影持有「后到样本替换」规则，正是它让某个步骤早期的 usage chunk 与其最终 assistant 消息不被重复计数；在此处再折算一次等于复制该规则，并可能与它漂移。

**无账可记时不打印汇总。** 装配没有该投影 seam，或本次运行的提供方从未上报用量——例如任何 usage 样本落地之前就失败的轮次——时不打印该行，而不是打印四个零，因此失败自身的 stderr 消息仍是最后一句话。

## 考虑的替代方案

**在答案之后把汇总打印到 stdout。** 否决：该 profile 的契约是格式纯净的 stdout，任何捕获答案的消费方都得再剥掉一行它并未索要的内容。

**用 `--tokens` 开关或 runner 配置项门控该行。** 否决：stderr 本就是该应用的诊断通道，汇总不可能污染被捕获的输出，而且当前没有任何消费方需要抑制它。一个无人要求静音的开关只是为配置而配置。

**在 runner 内部从 `agent.session.events` 折算用量。** 否决：见上文那条重复计数规则；token-meter 是该折算的唯一归属。

**在总量之外一并报告 `contextPressure` 占用率。** 否决：打印该行时运行已经结束，一个已完成的一次性任务的占用率并不能回答四个计费桶回答不了的任何问题。

## 后果

凡是提供方上报过用量的 headless 运行现在都会写出一行 stderr，钉住真实运行 stderr 的测试也随之携带它：`apps/cli/tests/profiles/headless` 的 `headless-profile` 期望输出 golden 在流式 reasoning 段之后追加该汇总，JSON 投影场景把它断言为该次运行唯一的 stderr 诊断，`apps/cli` built-bin e2e 的 headless 用例在 mock 的 reasoning 文本之后断言它。组合包为此新增了对 `dsh-session-projection` 与 `dsh-token-meter` 的纯类型 peer 依赖，用于注册表的 Context 合并与投影键声明。由于无账可记的运行保持静默，该行出现并不能证明运行成功，其缺失也不能证明装配里没有 token-meter。
