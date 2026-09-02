import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type { CredentialRef } from '@deepseek-ai/dsh-credentials'
import { MemoryCredentialProvider } from '../src/index.ts'

const KEY = credentialRef('DSH_CRED_TEST')
const OTHER = credentialRef('DSH_CRED_OTHER')

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanups.length > 0) await cleanups.pop()!()
})

async function boot(): Promise<Context> {
  const ctx = new Context()
  const fiber = ctx.plugin(MemoryCredentialProvider, {})
  cleanups.push(async () => { await fiber.dispose() })
  await fiber
  return ctx
}

/** Subscribe to credential updates; the subscription dies with the ctx. */
function updates(ctx: Context): CredentialRef[] {
  const seen: CredentialRef[] = []
  ctx.on('credentials/updated', (ref: CredentialRef) => { seen.push(ref) })
  return seen
}

describe('MemoryCredentialProvider', () => {
  it('reports an absent reference as unconfigured but writable', async () => {
    const ctx = await boot()
    expect(await ctx.credentials.describe(KEY)).toEqual({ configured: false, writable: true })
    expect(await ctx.credentials.resolve(KEY)).toBeUndefined()
  })

  it('stores a value, resolves it as memory, and notifies listeners', async () => {
    const ctx = await boot()
    const seen = updates(ctx)
    await ctx.credentials.set(KEY, 'secret-1')
    expect(seen).toEqual([KEY])
    expect(await ctx.credentials.resolve(KEY)).toEqual({ value: 'secret-1', source: 'memory' })
    expect(await ctx.credentials.describe(KEY)).toEqual({ configured: true, source: 'memory', writable: true })
  })

  it('overwrites the stored value and notifies on each change', async () => {
    const ctx = await boot()
    const seen = updates(ctx)
    await ctx.credentials.set(KEY, 'a')
    await ctx.credentials.set(KEY, 'b')
    expect(seen).toEqual([KEY, KEY])
    expect(await ctx.credentials.resolve(KEY)).toEqual({ value: 'b', source: 'memory' })
  })

  it('unsets a stored value and notifies; a no-op unset notifies nothing', async () => {
    const ctx = await boot()
    const seen = updates(ctx)
    await ctx.credentials.set(KEY, 'x')
    seen.length = 0
    await ctx.credentials.unset(KEY)
    expect(seen).toEqual([KEY])
    expect(await ctx.credentials.resolve(KEY)).toBeUndefined()
    expect(await ctx.credentials.describe(KEY)).toEqual({ configured: false, writable: true })
    // Deleting an absent reference changes nothing and notifies no one.
    seen.length = 0
    await ctx.credentials.unset(KEY)
    expect(seen).toEqual([])
  })

  it('keeps references independent', async () => {
    const ctx = await boot()
    await ctx.credentials.set(KEY, 'k')
    await ctx.credentials.set(OTHER, 'o')
    expect(await ctx.credentials.resolve(KEY)).toEqual({ value: 'k', source: 'memory' })
    expect(await ctx.credentials.resolve(OTHER)).toEqual({ value: 'o', source: 'memory' })
    await ctx.credentials.unset(KEY)
    expect(await ctx.credentials.resolve(KEY)).toBeUndefined()
    expect(await ctx.credentials.resolve(OTHER)).toEqual({ value: 'o', source: 'memory' })
  })

  it('rejects an empty value rather than storing a blank', async () => {
    const ctx = await boot()
    await expect(ctx.credentials.set(KEY, '')).rejects.toThrow(/empty value cannot be stored/)
    expect(await ctx.credentials.resolve(KEY)).toBeUndefined()
  })

  it('reaches a listener attached after a value was entered, by re-reading on each call', async () => {
    const ctx = await boot()
    // A value entered with no observer present still resolves.
    await ctx.credentials.set(KEY, 'pre-observer')
    const seen = updates(ctx)
    // Later mutations still reach the listener (per-call notification).
    await ctx.credentials.set(KEY, 'post-observer')
    expect(seen).toEqual([KEY])
    expect(await ctx.credentials.resolve(KEY)).toEqual({ value: 'post-observer', source: 'memory' })
  })

  it('contains a failing listener without failing the write', async () => {
    const ctx = await boot()
    ctx.on('credentials/updated', () => { throw new Error('listener broke') })
    // The write succeeds despite the listener throwing.
    await ctx.credentials.set(KEY, 'survives')
    expect(await ctx.credentials.resolve(KEY)).toEqual({ value: 'survives', source: 'memory' })
  })
})
