/**
 * The workspace-files panel: fills the sidebar's `sidebar.files` region with
 * a lazy file tree rooted at the selected workspace — the current session's
 * working directory, the folder the workspace is named after — falling back
 * to the host working directory when no session is current. The tree
 * lazy-loads one level at a time through the injected `listFiles` call
 * (directories first, then files); expanding a directory scans it on demand.
 * Hidden entries (host-flagged dot-prefixed) stay out of the tree. Switching
 * the current session re-roots the tree. Right-clicking a row raises a
 * context menu that reveals the entry in the OS file manager: a file opens
 * its containing folder, a directory opens itself. Pure consumer of the
 * injected face — all copy arrives through the bound translator.
 */
import { useCallback, useEffect, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactElement } from 'react'
import clsx from 'clsx'
import {
  IconChevronDownOutline14, IconChevronRightOutline14,
  IconFolderClose16, IconFolderOpen16, Menu,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { FileEntry, FileListing } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the SlotMap merge declaring the files seat and the runtime's
// GlobalStandardProps merge (the useSessions global hook).
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { TranslateNS } from '@deepseek-ai/dsh-client-locale/client'
import css from './FilesPanel.module.css'

/** Injected face: the file-listing wire call, the OS open, and copy (bound in apply's closure). */
export interface FilesPanelInjected {
  /** List one directory level (absent path = the host working directory). */
  listFiles: (path?: string, signal?: AbortSignal) => Promise<FileListing>
  /** Open a filesystem path with the OS default application (the file manager for directories). */
  openPath: (path: string) => Promise<void>
  /** Localized copy (this package's namespace). */
  t: TranslateNS<'files'>
}

/** Full component props: the files-region runtime share (wide, expandSidebar, global hooks) plus the injected face. */
export type FilesPanelProps = PropsRuntime<'sidebar.files'> & FilesPanelInjected

/** Key of the root level in the per-path loading/children maps. */
const ROOT_KEY = ''

/** Drop host-flagged hidden rows; the tree shows what a file browser normally would. */
function visible(entries: readonly FileEntry[]): FileEntry[] {
  return entries.filter(entry => !entry.hidden)
}

/** Right-click target: the row's entry, the folder containing it, and the pointer position. */
interface ContextMenuTarget {
  entry: FileEntry
  /** Absolute path of the directory containing the entry. */
  parentPath: string
  x: number
  y: number
}

/** One tree row: an expandable directory button or a plain file row. */
function FileRow({ entry, depth, expanded, parentPath, onToggle, onContextMenu }: {
  entry: FileEntry
  depth: number
  expanded: boolean
  /** Absolute path of the directory listing this entry. */
  parentPath: string
  onToggle: (entry: FileEntry) => void
  onContextMenu: (entry: FileEntry, parentPath: string, event: ReactMouseEvent) => void
}): ReactElement {
  const indent = { paddingInlineStart: 8 + depth * 14 }
  if (!entry.isDirectory) {
    return (
      <div
        className={clsx(css.row, css.file)}
        style={indent}
        onContextMenu={(event) => { onContextMenu(entry, parentPath, event) }}
      >
        <span className={css.fileGlyph} aria-hidden="true" />
        <span className={css.name}>{entry.name}</span>
      </div>
    )
  }
  return (
    <button
      type="button"
      className={css.row}
      style={indent}
      onClick={() => { onToggle(entry) }}
      onContextMenu={(event) => { onContextMenu(entry, parentPath, event) }}
    >
      {expanded ? <IconChevronDownOutline14 /> : <IconChevronRightOutline14 />}
      {expanded ? <IconFolderOpen16 /> : <IconFolderClose16 />}
      <span className={css.name}>{entry.name}</span>
    </button>
  )
}

/**
 * Render the workspace file tree for the sidebar files region.
 * @param props - files-region runtime share plus the injected files face.
 * @returns the file-tree panel filling the region.
 */
export function FilesPanel({ useSessions, listFiles, openPath, t }: FilesPanelProps): ReactElement {
  // The selected workspace's folder: the current session's working directory,
  // absent until a session is current (then the host working directory).
  const rootPath = useSessions((s) => {
    const current = s.current
    if (current === undefined) return undefined
    return s.byId[current]?.cwd
  })

  const [root, setRoot] = useState<FileListing | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [children, setChildren] = useState<Record<string, FileListing>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  // Right-click reveal menu: the target row plus the pointer position the
  // portal list anchors on.
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null)

  const loadRoot = useCallback(async (): Promise<void> => {
    setLoaded(true)
    setLoading(map => ({ ...map, [ROOT_KEY]: true }))
    setFailed(map => ({ ...map, [ROOT_KEY]: false }))
    try {
      setRoot(await listFiles(rootPath))
    } catch {
      setRoot(null)
      setFailed(map => ({ ...map, [ROOT_KEY]: true }))
    } finally {
      setLoading(map => ({ ...map, [ROOT_KEY]: false }))
    }
  }, [listFiles, rootPath])

  const loadDir = useCallback(async (path: string): Promise<void> => {
    setLoading(map => ({ ...map, [path]: true }))
    setFailed(map => ({ ...map, [path]: false }))
    try {
      const listing = await listFiles(path)
      setChildren(map => ({ ...map, [listing.path]: listing }))
    } catch {
      setFailed(map => ({ ...map, [path]: true }))
    } finally {
      setLoading(map => ({ ...map, [path]: false }))
    }
  }, [listFiles])

  // A new current session means a new root folder: drop the rendered tree so
  // the effect below rescans the new directory.
  useEffect(() => {
    setRoot(null)
    setLoaded(false)
    setChildren({})
    setExpanded({})
    setLoading({})
    setFailed({})
  }, [rootPath])

  // Scan the root level on mount and whenever the root folder changes.
  useEffect(() => {
    if (loaded || loading[ROOT_KEY] === true) return
    void loadRoot()
  }, [loaded, loading, loadRoot])

  const toggleDir = (entry: FileEntry): void => {
    const next = expanded[entry.path] !== true
    setExpanded(map => ({ ...map, [entry.path]: next }))
    if (next && children[entry.path] === undefined && loading[entry.path] !== true) void loadDir(entry.path)
  }

  // Right-click raises the reveal menu at the pointer; the native browser menu
  // is suppressed so the row action owns the gesture.
  const openContextMenu = (entry: FileEntry, parentPath: string, event: ReactMouseEvent): void => {
    event.preventDefault()
    setContextMenu({ entry, parentPath, x: event.clientX, y: event.clientY })
  }

  const renderLevel = (entries: readonly FileEntry[], depth: number, parentPath: string): ReactElement => (
    <ul className={css.level}>
      {visible(entries).map(entry => (
        <li key={entry.path}>
          <FileRow
            entry={entry}
            depth={depth}
            expanded={expanded[entry.path] === true}
            parentPath={parentPath}
            onToggle={toggleDir}
            onContextMenu={openContextMenu}
          />
          {entry.isDirectory && expanded[entry.path] === true && renderChildren(entry.path, depth + 1)}
        </li>
      ))}
    </ul>
  )

  const renderChildren = (path: string, depth: number): ReactElement | null => {
    if (loading[path] === true) return <div className={css.status}>{t('browser.loading')}</div>
    if (failed[path] === true) return <div className={clsx(css.status, css.error)}>{t('browser.error')}</div>
    const listing = children[path]
    // Defensive arm: toggleDir only expands after starting the load (or with a
    // cached listing), so an expanded level is never rendered without one of
    // loading/failed/listing — the guard keeps a state skew from throwing.
    /* v8 ignore next -- unreachable unless expansion and load state desynchronize. */
    if (listing === undefined) return null
    if (visible(listing.entries).length === 0) return <div className={css.status}>{t('browser.empty')}</div>
    return renderLevel(listing.entries, depth, listing.path)
  }

  const body = (): ReactElement => {
    if (loading[ROOT_KEY] === true) return <div className={css.status}>{t('browser.loading')}</div>
    if (failed[ROOT_KEY] === true) return <div className={clsx(css.status, css.error)}>{t('browser.error')}</div>
    if (root === null) return <div className={css.status}>{t('browser.loading')}</div>
    return (
      <>
        {visible(root.entries).length === 0
          ? <div className={css.status}>{t('browser.empty')}</div>
          : renderLevel(root.entries, 0, root.path)}
        {root.truncated && <div className={css.status}>{t('browser.truncated')}</div>}
      </>
    )
  }

  return (
    <div className={css.panel}>
      <div className={css.header}>
        <IconFolderClose16 size={14} />
        <span className={css.headerLabel} title={root?.path}>{t('browser.title')}</span>
      </div>
      <div className={css.tree}>
        {body()}
      </div>
      {contextMenu !== null && (
        <Menu
          open
          portal
          dense
          anchor={null}
          getAnchorRect={() => new DOMRect(contextMenu.x, contextMenu.y, 0, 0)}
          items={contextMenu.entry.isDirectory
            ? [{ id: 'open-folder', label: t('browser.menu.openFolder') }]
            : [{ id: 'open-containing-folder', label: t('browser.menu.openContainingFolder') }]}
          onSelect={() => {
            const target = contextMenu.entry.isDirectory ? contextMenu.entry.path : contextMenu.parentPath
            setContextMenu(null)
            // A rejected OS open leaves the tree unchanged; nothing here can
            // surface it usefully, so the failure is swallowed.
            void openPath(target).catch(() => {})
          }}
          onClose={() => { setContextMenu(null) }}
        />
      )}
    </div>
  )
}
