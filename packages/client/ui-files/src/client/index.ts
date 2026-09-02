/**
 * Browser half of the workspace-files plugin: registers the files panel into
 * ui-sidebar's `sidebar.files` region seat, shown when the sidebar's view
 * toggle selects Files. The panel lazy-loads the selected workspace's folder
 * (the current session's working directory), driving the node half's
 * `host.listFiles` primitive through the workspaces service. Mounting this
 * package composes the panel with one cordis.yml row. The copy is
 * locale-registered here.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls ui-sidebar's SlotMap merge declaring the files seat.
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { FilesPanelInjected } from './FilesPanel.tsx'
import { FilesPanel } from './FilesPanel.tsx'
import { en, zh, type FilesKey } from './locales.ts'

export type { FilesPanelInjected, FilesPanelProps } from './FilesPanel.tsx'
export type { FilesKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Workspace-files copy. */
    files: FilesKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'files'

/** Required services (cordis fiber inject): the slot registry, the wire-facing workspace service, and locale. */
export const inject = ['slots', 'workspaces', 'locale']

/**
 * Client plugin body: register the files dictionaries and the files panel.
 * `slots.inject` waits on ui-sidebar's seat declaration, so activation order
 * between the two packages is unconstrained.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-files: dictionaries')

  const injected = (): FilesPanelInjected => ({
    listFiles: (path, signal) => ctx.workspaces.listFiles(path, signal),
    openPath: path => ctx.workspaces.openPath(path),
    t: ctx.locale.bind(NS),
  })
  ctx.effect(
    () => ctx.slots.inject('sidebar.files', () => ctx.slots.register({
      name: 'sidebar.files',
      locale: NS,
      inject: injected,
    }, FilesPanel)),
    'ui-files: files panel registration',
  )
}
