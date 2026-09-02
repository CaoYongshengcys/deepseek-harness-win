# dsh-credentials-memory

English | [中文](README.zh.md)

In-memory [credentials](../credentials/README.md) provider: values written through the seam live in the process address space only. Nothing is read from or written to disk, so a deployment image, a profile directory, or a process dump captured after shutdown never carries a secret this process was told.

A key entered on the Models page takes effect on the next request and is lost when the process exits — the operator re-enters it on each launch. There is no environment fallback and no `.env` layer: this provider serves deployments where the whole point is that no secret is reachable from the filesystem or the launching environment. Composition that wants the file/environment layering mounts `dsh-credentials-local` instead.

## Config

No fields. The provider reads nothing external; an empty config carries nothing to resolve.

## Source id

`memory` — reported by `describe()` alongside `configured: true, writable: true`. `resolve()` returns `undefined` while no value is stored, so the consuming adapter sees the credential as unconfigured until the operator enters it.

## When to mount this over `dsh-credentials-local`

- A web deployment published to an external network, where the image and `$DSH_HOME` must stay secret-free.
- Any run where the operator will enter the key at runtime and the launch environment must not carry it.

`dsh-credentials-local` remains the default for CLI/CI runs that read a key from the environment or `$DSH_HOME/.credentials.yaml`.

## Model Experience

None; this package carries no model behavior.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **No persistence across restarts** — by design; a deployment relying on this provider re-enters the key on each launch.
- **No environment fallback** — a key in the launching environment or a `.env` is not seen; mount `dsh-credentials-local` when that layering is wanted.
