/**
 * host.listFiles over createApiProxy: cwd-rooted and explicit-path listings,
 * directories-first ordering, hidden flagging, the complete-result bound, and
 * the unreadable/abort error mapping. Runs against a real temporary directory.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import SessionStore from '@deepseek-ai/dsh-session'
import UserQuestionService from '@deepseek-ai/dsh-user-questions'
import { createApiProxy } from '../src/api-proxy.ts'
import type { RpcRequest, RpcResponse } from '../src/api/rpc.ts'
import { RpcId } from '../src/api/rpc.ts'

let nextRpc = 1
function request<P>(payload: P): RpcRequest<P> {
  return { rpcId: RpcId(`req-${String(nextRpc++)}`), payload }
}

function expectOk<T>(response: RpcResponse<T>): T {
  expect(response.result.ok).toBe(true)
  if (!response.result.ok) throw new Error('unreachable')
  return response.result.value
}

function expectErr<T>(response: RpcResponse<T>): { code: string; message: string; details: unknown } {
  expect(response.result.ok).toBe(false)
  if (response.result.ok) throw new Error('unreachable')
  return response.result.error
}

const signal = (): AbortSignal => new AbortController().signal

describe('host.listFiles', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'dsh-list-files-'))
    await mkdir(join(dir, 'sub'))
    await mkdir(join(dir, 'alpha'))
    await writeFile(join(dir, 'note.txt'), 'x')
    await writeFile(join(dir, '.hidden'), 'x')
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  const api = async (cwd: string, listFilesMaxEntries?: number) => {
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    await ctx.plugin(UserQuestionService)
    await ctx.plugin(AgentRegistry)
    return createApiProxy(ctx, {
      defaultModelSelection: () => ({ provider: 'p', model: 'm' }),
      cwd,
      ...(listFilesMaxEntries === undefined ? {} : { listFilesMaxEntries }),
    })
  }

  it('lists the host working directory when no path is given', async () => {
    const value = expectOk(await (await api(dir)).host.listFiles(request({}), signal()))
    expect(value.path).toBe(resolve(dir))
    // Directories first (name-sorted), then files (name-sorted); hidden flagged, not dropped.
    expect(value.entries.map(e => `${e.name}:${e.isDirectory ? 'd' : 'f'}`)).toEqual([
      'alpha:d', 'sub:d', '.hidden:f', 'note.txt:f',
    ])
    expect(value.entries.find(e => e.name === '.hidden')?.hidden).toBe(true)
    expect(value.entries.find(e => e.name === 'note.txt')?.hidden).toBe(false)
    expect(value.truncated).toBe(false)
  })

  it('lists an explicit directory path', async () => {
    await writeFile(join(dir, 'sub', 'inner.txt'), 'x')
    const value = expectOk(await (await api('/somewhere-else')).host.listFiles(request({ path: join(dir, 'sub') }), signal()))
    expect(value.path).toBe(resolve(join(dir, 'sub')))
    expect(value.entries.map(e => e.name)).toEqual(['inner.txt'])
  })

  it('resolves the cwd fallback for an empty listing', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'dsh-list-files-empty-'))
    try {
      const value = expectOk(await (await api(empty)).host.listFiles(request({}), signal()))
      expect(value.entries).toEqual([])
      expect(value.truncated).toBe(false)
    } finally {
      await rm(empty, { recursive: true, force: true })
    }
  })

  it('bounds a level at listFilesMaxEntries and reports truncation', async () => {
    const value = expectOk(await (await api(dir, 2)).host.listFiles(request({}), signal()))
    expect(value.entries).toHaveLength(2)
    expect(value.truncated).toBe(true)
  })

  it('fails with directory-unreadable for a missing target', async () => {
    const error = expectErr(await (await api(dir)).host.listFiles(request({ path: join(dir, 'nope') }), signal()))
    expect(error.code).toBe('directory-unreadable')
    expect((error.details as { path: string }).path).toBe(resolve(join(dir, 'nope')))
  })

  it('fails with directory-unreadable for a file target', async () => {
    const error = expectErr(await (await api(dir)).host.listFiles(request({ path: join(dir, 'note.txt') }), signal()))
    expect(error.code).toBe('directory-unreadable')
  })

  it('reports cancelled when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const error = expectErr(await (await api(dir)).host.listFiles(request({}), controller.signal))
    expect(error.code).toBe('cancelled')
  })
})
