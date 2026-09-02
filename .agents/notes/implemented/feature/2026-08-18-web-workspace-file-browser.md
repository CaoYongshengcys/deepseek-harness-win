# Agent Note: Web workspace file browser

Status: implemented

English | [中文](2026-08-18-web-workspace-file-browser.zh.md)

## Problem

The web surface had no way to see the files of the working directory: the sidebar lists sessions grouped by workspace, but nothing exposed the directory's contents, so a user had to ask the agent to `ls` in order to know what was there. The directory-picker seam already lists directories, but only directories, and only to pick a workspace root — it is not a file browser and its `browse` capability is not always mounted (a native-display deployment picks natively).

## Decision

**A new read-only `host.listFiles` primitive lists one directory level's files and directories.** It sits on the existing `HostApi` beside `listDirectory`, but is always served rather than gated behind the directory-picker `browse` capability: it is a read-only listing like `openPath`, and gating it would make the file browser disappear exactly on the native-display deployments that most often run the web UI. An absent path lists the host process working directory — the same root `session.create` falls back to — so the tree matches where an unspecified-cwd session lands. Entries are directories first then files, each group name-sorted; hidden entries are host-flagged, not dropped, and the client owns whether to show them. A level is bounded by a `listFilesMaxEntries` gateway-config bound (default 1000, matching the directory-picker browse default) with `truncated` flagging a cut.

**The client exposes it through the existing workspaces service.** `ctx.workspaces.listFiles(path?, signal?)` wraps the wire call alongside `listDirectory`/`createDirectory`/`openPath`; the `FileListing`/`FileEntry` types ride the existing apiproxy → connection → api-remotes re-export chain.

**A new `ui-files` client plugin renders it as a persistent sidebar panel.** ui-sidebar declares a `sidebar.files` single seat beside `sidebar.workspaces` and a wide-only Sessions/Files view switch above the browsing region; the shell renders one seat or the other (the rail always shows the session list). `FilesPanel` registers into `sidebar.files` and fills the region with a lazy file tree: the root level loads on mount, expanding a directory scans it on demand, and loading/empty/failed/truncated states render inline at the level they describe. Hidden entries stay out of the tree. The target seat is ui-sidebar-declared, so `apply` uses `slots.inject()` to register for the declaration lifetime.

**The tree is rooted at the selected workspace.** `FilesPanel` reads the current session through the global `useSessions` kit and lists its `cwd` — the folder the workspace is named after — so picking a workspace and switching to Files shows that folder's contents. With no current session it falls back to the absent-path listing (the host working directory). A current-session change re-roots the tree.

## Alternatives considered

**Extend the directory-picker `browse` capability to return files.** Rejected: that seam's contract is deliberately directories-only for workspace picking, and it is not mounted on native-display deployments, which would hide the file browser there.

**A popup modal opened from a footer action.** Rejected in favor of the persistent panel: browsing the workspace should feel like browsing a folder, always one switch away, not a transient dialog. The panel reuses the shell's existing region geometry, so the collapse/rail behavior is untouched — the rail simply keeps the session list.

**Root the tree at the host working directory only.** Rejected: selecting a workspace must show that folder's files, and the current session's `cwd` is exactly it; the host cwd remains only the no-session fallback.

## Consequences

`host.listFiles` is a new wire method, so every `HostApi` test double and the fixture carrier implement it. ui-sidebar gains the `sidebar.files` seat and the Sessions/Files view switch, so its rendered output (and snapshots) carry the toggle. The file browser is read-only; reveal/open, free path entry, and hidden-entry toggling are deferred (recorded in the package README's Known Limitations).
