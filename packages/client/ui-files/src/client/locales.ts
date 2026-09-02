/** `files` namespace dictionaries: the workspace file panel's copy. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'browser.title': '工作区文件',
  'browser.loading': '加载中…',
  'browser.empty': '（空目录）',
  'browser.error': '无法加载文件列表',
  'browser.truncated': '条目过多，仅显示开头部分。',
  'browser.menu.openContainingFolder': '打开所在文件夹',
  'browser.menu.openFolder': '在文件管理器中打开',
} satisfies Record<string, string>

/** The files namespace key union. */
export type FilesKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'browser.title': 'Workspace Files',
  'browser.loading': 'Loading…',
  'browser.empty': '(empty directory)',
  'browser.error': 'Unable to load the file list',
  'browser.truncated': 'Too many entries to list; only the beginning is shown.',
  'browser.menu.openContainingFolder': 'Open Containing Folder',
  'browser.menu.openFolder': 'Open in File Manager',
} satisfies Record<FilesKey, string>
