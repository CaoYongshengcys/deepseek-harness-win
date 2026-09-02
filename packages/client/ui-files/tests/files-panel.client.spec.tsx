// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { FileListing, SessionListState, WorkspaceListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { TranslateNS } from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the `files` LocaleNamespaceMap merge so TranslateNS<'files'> resolves.
import type {} from '../src/client/index.ts'
import { FilesPanel } from '../src/client/FilesPanel.tsx'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

const ROOT = '/work'
const SRC = `${ROOT}/src`
const README = `${ROOT}/README.md`

const t = ((key: string) => en[key as keyof typeof en] ?? key) as TranslateNS<'files'>

/** Global-kit session hook stub whose current session carries `cwd`. */
function makeUseSessions(cwd?: string) {
  const state = {
    current: cwd === undefined ? undefined : 'sess-1',
    byId: cwd === undefined ? {} : { 'sess-1': { cwd } },
  } as unknown as SessionListState
  return <S,>(sel: (s: SessionListState) => S): S => sel(state)
}

/** Global-kit workspace hook stub (the component does not read it). */
const useWorkspaces = <S,>(sel: (s: WorkspaceListState) => S): S => sel({} as unknown as WorkspaceListState)

/** Fixed two-level tree: root holds one directory, one file, one hidden row. */
function listingFor(path?: string): FileListing {
  const target = path ?? ROOT
  if (target === ROOT) {
    return {
      path: ROOT,
      entries: [
        { name: 'src', path: SRC, isDirectory: true, hidden: false },
        { name: 'README.md', path: README, isDirectory: false, hidden: false },
        { name: '.env', path: `${ROOT}/.env`, isDirectory: false, hidden: true },
      ],
      truncated: false,
    }
  }
  if (target === SRC) {
    return {
      path: SRC,
      entries: [{ name: 'index.ts', path: `${SRC}/index.ts`, isDirectory: false, hidden: false }],
      truncated: false,
    }
  }
  throw new Error(`unexpected listing ${target}`)
}

function renderPanel(
  listFiles: (path?: string) => Promise<FileListing>,
  opts: { cwd?: string | undefined; openPath?: (path: string) => Promise<void> } = {},
) {
  const cwd = 'cwd' in opts ? opts.cwd : ROOT
  const openPath = opts.openPath ?? (() => Promise.resolve())
  return render(
    <FilesPanel
      wide
      expandSidebar={() => {}}
      useSessions={makeUseSessions(cwd)}
      useWorkspaces={useWorkspaces}
      listFiles={listFiles}
      openPath={openPath}
      t={t}
    />,
  )
}

describe('FilesPanel', () => {
  it('roots at the current session workspace and hides hidden entries', async () => {
    const listFiles = vi.fn((path?: string) => Promise.resolve(listingFor(path)))
    renderPanel(listFiles)
    await waitFor(() => { expect(screen.getByText('README.md')).toBeDefined() })
    // The selected workspace folder — not an absent/host path — is listed.
    expect(listFiles).toHaveBeenCalledWith(ROOT)
    expect(screen.queryByText('.env')).toBeNull()
  })

  it('falls back to the host working directory with no current session', async () => {
    const listFiles = vi.fn((path?: string) => Promise.resolve(listingFor(path)))
    renderPanel(listFiles, { cwd: undefined })
    await waitFor(() => { expect(screen.getByText('README.md')).toBeDefined() })
    expect(listFiles).toHaveBeenCalledWith(undefined)
  })

  it('expands a directory on demand and lists its children', async () => {
    const listFiles = vi.fn((path?: string) => Promise.resolve(listingFor(path)))
    renderPanel(listFiles)
    await waitFor(() => { expect(screen.getByText('src')).toBeDefined() })
    fireEvent.click(screen.getByText('src'))
    await waitFor(() => { expect(screen.getByText('index.ts')).toBeDefined() })
    expect(listFiles).toHaveBeenCalledWith(SRC)
  })

  it('collapses an expanded directory without rescanning', async () => {
    const listFiles = vi.fn((path?: string) => Promise.resolve(listingFor(path)))
    renderPanel(listFiles)
    await waitFor(() => { expect(screen.getByText('src')).toBeDefined() })
    fireEvent.click(screen.getByText('src'))
    await waitFor(() => { expect(screen.getByText('index.ts')).toBeDefined() })
    fireEvent.click(screen.getByText('src'))
    expect(screen.queryByText('index.ts')).toBeNull()
    expect(listFiles).toHaveBeenCalledTimes(2)
  })

  it('reports an empty directory', async () => {
    const listFiles = vi.fn((path?: string) => Promise.resolve(
      path === SRC
        ? { path: SRC, entries: [], truncated: false }
        : listingFor(path),
    ))
    renderPanel(listFiles)
    await waitFor(() => { expect(screen.getByText('src')).toBeDefined() })
    fireEvent.click(screen.getByText('src'))
    await waitFor(() => { expect(screen.getByText('(empty directory)')).toBeDefined() })
  })

  it('reports a failed root level', async () => {
    const listFiles = vi.fn(() => Promise.reject(new Error('boom')))
    renderPanel(listFiles)
    await waitFor(() => { expect(screen.getByText('Unable to load the file list')).toBeDefined() })
  })

  it('reports a truncated root level', async () => {
    const listFiles = vi.fn(() => Promise.resolve({ ...listingFor(), truncated: true }))
    renderPanel(listFiles)
    await waitFor(() => { expect(screen.getByText('Too many entries to list; only the beginning is shown.')).toBeDefined() })
  })

  it('shows the loading state before the root settles', async () => {
    let release: (value: FileListing) => void = () => {}
    const pending = new Promise<FileListing>((resolve) => { release = resolve })
    renderPanel(() => pending)
    await waitFor(() => { expect(screen.getByText('Loading…')).toBeDefined() })
    await act(async () => { release(listingFor()) })
    await waitFor(() => { expect(screen.getByText('README.md')).toBeDefined() })
  })

  it('reports an empty root directory', async () => {
    const listFiles = vi.fn(() => Promise.resolve({ path: ROOT, entries: [], truncated: false }))
    renderPanel(listFiles)
    await waitFor(() => { expect(screen.getByText('(empty directory)')).toBeDefined() })
  })

  it('reports a failed subdirectory level inline', async () => {
    const listFiles = vi.fn((path?: string) => path === SRC
      ? Promise.reject(new Error('boom'))
      : Promise.resolve(listingFor(path)))
    renderPanel(listFiles)
    await waitFor(() => { expect(screen.getByText('src')).toBeDefined() })
    fireEvent.click(screen.getByText('src'))
    await waitFor(() => { expect(screen.getByText('Unable to load the file list')).toBeDefined() })
  })

  it('right-clicking a file offers opening its containing folder', async () => {
    const openPath = vi.fn(() => Promise.resolve())
    const listFiles = vi.fn((path?: string) => Promise.resolve(listingFor(path)))
    renderPanel(listFiles, { openPath })
    await waitFor(() => { expect(screen.getByText('README.md')).toBeDefined() })
    fireEvent.contextMenu(screen.getByText('README.md'), { clientX: 40, clientY: 90 })
    const item = await screen.findByText('Open Containing Folder')
    fireEvent.click(item)
    expect(openPath).toHaveBeenCalledWith(ROOT)
    await waitFor(() => { expect(screen.queryByText('Open Containing Folder')).toBeNull() })
  })

  it('right-clicking a directory offers opening the directory itself', async () => {
    const openPath = vi.fn(() => Promise.resolve())
    const listFiles = vi.fn((path?: string) => Promise.resolve(listingFor(path)))
    renderPanel(listFiles, { openPath })
    await waitFor(() => { expect(screen.getByText('src')).toBeDefined() })
    fireEvent.contextMenu(screen.getByText('src'), { clientX: 40, clientY: 60 })
    const item = await screen.findByText('Open in File Manager')
    fireEvent.click(item)
    expect(openPath).toHaveBeenCalledWith(SRC)
  })

  it('opens the containing folder of a nested file', async () => {
    const openPath = vi.fn(() => Promise.resolve())
    const listFiles = vi.fn((path?: string) => Promise.resolve(listingFor(path)))
    renderPanel(listFiles, { openPath })
    await waitFor(() => { expect(screen.getByText('src')).toBeDefined() })
    fireEvent.click(screen.getByText('src'))
    await waitFor(() => { expect(screen.getByText('index.ts')).toBeDefined() })
    fireEvent.contextMenu(screen.getByText('index.ts'), { clientX: 50, clientY: 110 })
    fireEvent.click(await screen.findByText('Open Containing Folder'))
    expect(openPath).toHaveBeenCalledWith(SRC)
  })

  it('swallows a rejected OS open without disturbing the tree', async () => {
    const openPath = vi.fn(() => Promise.reject(new Error('no handler')))
    const listFiles = vi.fn((path?: string) => Promise.resolve(listingFor(path)))
    renderPanel(listFiles, { openPath })
    await waitFor(() => { expect(screen.getByText('README.md')).toBeDefined() })
    fireEvent.contextMenu(screen.getByText('README.md'), { clientX: 40, clientY: 90 })
    fireEvent.click(await screen.findByText('Open Containing Folder'))
    await waitFor(() => { expect(openPath).toHaveBeenCalledWith(ROOT) })
    // The tree still renders; the rejection surfaced nowhere.
    expect(screen.getByText('README.md')).toBeDefined()
  })

  it('closes the context menu on an outside click', async () => {
    const listFiles = vi.fn((path?: string) => Promise.resolve(listingFor(path)))
    renderPanel(listFiles)
    await waitFor(() => { expect(screen.getByText('README.md')).toBeDefined() })
    fireEvent.contextMenu(screen.getByText('README.md'), { clientX: 40, clientY: 90 })
    await screen.findByText('Open Containing Folder')
    fireEvent.pointerDown(document.body)
    await waitFor(() => { expect(screen.queryByText('Open Containing Folder')).toBeNull() })
  })
})
