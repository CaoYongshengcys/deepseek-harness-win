# @deepseek-ai/dsh-client-ui-files

English | [中文](README.zh.md)

Workspace files plugin. `FilesPanel` registers into the sidebar's `sidebar.files` region seat, rendering a persistent file tree of the selected workspace's folder that the sidebar's Sessions/Files view switch shows in place of the session list.

The tree lazy-loads one directory level at a time through the `host.listFiles` primitive (exposed by the workspaces service). It is rooted at the selected workspace — the current session's working directory, the folder the workspace is named after — read through the global `useSessions` kit, and re-roots when the current session changes; with no current session it falls back to the host process working directory. Expanding a directory scans it on demand. Entries are directories first then files, each group name-sorted; host-flagged hidden entries (dot-prefixed on POSIX) stay out of the tree. A level cut at the host's complete-result bound reports a truncation note. Loading, empty, and failure states render inline at the level they describe. Right-clicking a row raises a context menu that reveals the entry through `host.openPath`: a file row opens its containing folder in the OS file manager, a directory row opens the directory itself.

The panel fills the sidebar browsing region when the view switch selects Files; the collapsed rail keeps the session list, so the panel is a wide-only view. It is plain in-page content — it neither creates nor targets a native window.

The panel's copy is locale-registered here under the `files` namespace. The target slot is declared by ui-sidebar, so `apply` uses `slots.inject()` to register for the declaration lifetime and re-register after the slot is restored.

## Model Experience

None, as the file browser is browser chrome; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **No mutation affordances** — the tree lists and reveals entries only; it offers no rename, delete, or create actions.
- **No free path entry** — the root follows the current session's workspace (falling back to the host cwd); there is no path-entry or arbitrary root-switching control.
- **Hidden entries are always hidden** — there is no toggle to reveal host-flagged hidden (dot-prefixed) entries.
