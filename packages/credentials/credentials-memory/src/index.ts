/**
 * In-memory credentials provider. Values written through the seam live in the
 * process address space only: nothing is read from or written to disk, so a
 * deployment image, a profile directory, or a process dump captured after
 * shutdown never carries a secret this process was told. A key entered through
 * the Models page takes effect on the next request and is lost when the
 * process exits — the operator re-enters it on each launch.
 *
 * There is no environment fallback and no `.env` layer: this provider serves
 * deployments where the whole point is that no secret is reachable from the
 * filesystem or the launching environment. Composition that wants the
 * file/environment layering mounts `dsh-credentials-local` instead.
 *
 * Resolution is per call, like every provider: consumers re-resolve at each
 * operation, so a changed credential reaches the next operation without a
 * restart. An empty stored value is absent everywhere.
 * @module @deepseek-ai/dsh-credentials-memory
 */

import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import type { CredentialInfo, CredentialRef, ResolvedCredential } from '@deepseek-ai/dsh-credentials'

/** Source layer id this provider reports through the seam. */
const SOURCE = 'memory'

/** Plugin config: no fields today; reserved for future runtime scoping (e.g. namespace isolation). */
export interface Config {}

/**
 * In-memory credentials provider: a `Map` of reference to non-empty value,
 * never persisted. One process holds one store; values do not survive a
 * restart, which is the guarantee a deployable image relies on. There is
 * nothing to resolve from an empty config — no file, no environment — so,
 * unlike the file provider, this one carries no resolved spec object, and no
 * `[Service.init]` teardown: the store dies with the instance, with no
 * watcher to close or queue to drain.
 */
export class MemoryCredentialProvider extends CredentialProvider {
  static Config: z<Config> = z.object({})

  /** The secret store; entries are absent until {@link set} adds them. */
  private readonly values = new Map<string, string>()

  constructor(ctx: Context, config: Config) {
    super(ctx)
    // The base constructor is the full setup; an empty config carries nothing
    // to resolve, and a `resolveSpec` step with no inputs would be ceremony.
    void config
  }

  override resolve(ref: CredentialRef): Promise<ResolvedCredential | undefined> {
    const stored = this.values.get(ref)
    if (stored === undefined) return Promise.resolve(undefined)
    return Promise.resolve({ value: stored, source: SOURCE })
  }

  override describe(ref: CredentialRef): Promise<CredentialInfo> {
    if (this.values.get(ref) !== undefined) {
      return Promise.resolve({ configured: true, source: SOURCE, writable: true })
    }
    return Promise.resolve({ configured: false, writable: true })
  }

  override set(ref: CredentialRef, value: string): Promise<void> {
    if (value.length === 0) {
      return Promise.reject(new Error(`credentials-memory: an empty value cannot be stored for "${ref}"; use unset`))
    }
    this.values.set(ref, value)
    // After the commit: a broken observer must never make the in-memory write
    // look failed (an INVARIANT failure still rethrows from notifyUpdated).
    this.notifyUpdated(ref)
    return Promise.resolve()
  }

  override unset(ref: CredentialRef): Promise<void> {
    // Removing an absent reference is a no-op: no notification, matching the
    // file provider's contract that a delete of nothing changes nothing.
    if (this.values.delete(ref)) this.notifyUpdated(ref)
    return Promise.resolve()
  }
}

export default MemoryCredentialProvider
