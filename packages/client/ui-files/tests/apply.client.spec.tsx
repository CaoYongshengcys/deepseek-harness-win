/** Files panel registration into the sidebar files seat and its injected wire face. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { apply, inject } from '@deepseek-ai/dsh-client-ui-files/client'
import type { FilesPanelInjected } from '@deepseek-ai/dsh-client-ui-files/client'

async function bench(declare = true) {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const workspaces = {
    listFiles: vi.fn(() => Promise.resolve({ path: '/w', entries: [], truncated: false })),
    openPath: vi.fn(() => Promise.resolve()),
  }
  ctx.provide('workspaces', workspaces as never)
  ctx.provide('locale', new LocaleRuntime(ctx))
  const slots = ctx.get('slots') as SlotRegistry
  if (declare) {
    slots.register(
      { name: 'root', children: { 'sidebar.files': { kind: 'single', scope: 'root' } } } as never,
      () => null,
    )
  }
  return { ctx, slots, workspaces }
}

describe('ui-files apply', () => {
  it('declares only the services it uses', () => {
    expect(inject).toEqual(['slots', 'workspaces', 'locale'])
  })

  it('registers the files panel into the declared seat', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const entries = b.slots.entries('sidebar.files')
    expect(entries).toHaveLength(1)
    expect(entries[0]!.locale).toBe('files')
    const injected = (entries[0]!.inject as unknown as () => FilesPanelInjected)()
    expect(Object.keys(injected)).toEqual(['listFiles', 'openPath', 't'])
    await injected.listFiles('/w/x')
    expect(b.workspaces.listFiles).toHaveBeenCalledWith('/w/x', undefined)
    await injected.openPath('/w/x')
    expect(b.workspaces.openPath).toHaveBeenCalledWith('/w/x')
    expect(injected.t('browser.title')).toBe('工作区文件')
  })

  it('waits for the seat declaration when it activates first', async () => {
    const b = await bench(false)
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(b.slots.entries('sidebar.files')).toHaveLength(0)
    // Declaring later installs the pending registration.
    b.slots.register(
      { name: 'root', children: { 'sidebar.files': { kind: 'single', scope: 'root' } } } as never,
      () => null,
    )
    await vi.waitFor(() => { expect(b.slots.entries('sidebar.files')).toHaveLength(1) })
  })

  it('removes the entry on teardown', async () => {
    const b = await bench()
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(b.slots.entries('sidebar.files')).toHaveLength(1)
    await fiber.dispose()
    expect(b.slots.entries('sidebar.files')).toHaveLength(0)
  })
})
