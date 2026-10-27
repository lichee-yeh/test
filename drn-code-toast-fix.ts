const TOOL_ID = 'f1f27f78-9161-49b6-a93a-bb0722076c90'
const DISPLAY_NAME = 'Design Release Notes'
const ROOT_KEY = 'design-log-root'
const OWN_KEY = 'design-log-owned'
const DATA_KEY = 'design-log-document'
const TAGS = ['Feature', 'Proposed', 'Updated', 'In progress', 'Draft', 'Beta', 'Released', 'Removed', 'Deprecated', 'Bug fix', 'Web', 'Mobile', 'Tablet']
const STATUSES = ['Draft', 'In Review', 'Released', 'Deprecated'] as const
const MAX_GROUPS = 30
type ChangeItem = { text: string; url: string }
type ChangeGroup = { type: '' | 'New' | 'Feature' | 'Updated' | 'Fixed' | 'Removed'; title: string; items: ChangeItem[] }
type Asset = { id: string; kind: 'image' | 'file'; name: string; mime: string; size: number; hash: string; width: number; height: number }
const ASSET_KEY = 'design-log-asset-'
const staged = new Map<string, { asset: Asset; bytes: Uint8Array }>()
type LogEntry = { title: string; description: string; version: string; author: string; link: string; updated: string; attachments: string[]; assets: Asset[]; tags: string[]; status: '' | typeof STATUSES[number]; drApproved: string; rdDelivered: string; done: boolean; groups: ChangeGroup[] }
type LogDocument = { versionMode: 'manual' | 'auto'; versionFormat: 'two' | 'three'; defaultVersionBump: 'major' | 'minor' | 'patch'; headerStyle: 'solid' | 'gradient'; headerEnd: string; outputVersionLimit: 0 | 10 | 20 | 30; showCreatedDate: boolean; showUpdatedDate: boolean; showEntryDates: boolean; showLatestVersion: boolean; showLatestRelease: boolean; entryOrder: 'latest' | 'manual'; title: string; version: string; created: string; updated: string; showDraft: boolean; showDates: boolean; showVersions: boolean; theme: 'light' | 'dark'; size: 'normal' | 'compact'; accent: string; entries: LogEntry[] }
type Message = { type: 'ready' } | { type: 'resize'; height: number } | { type: 'save'; action: 'create' | 'update'; targetId: string | null; document: unknown } | { type: 'upload'; requestId: string; asset: unknown; bytes: Uint8Array } | { type: 'asset'; requestId: string; sourceId: string | null; id: string } | { type: 'release'; ids: string[] }
type FontSet = { regular: FontName; medium: FontName; semibold: FontName; bold: FontName }
class ValidationError extends Error {}
let executing = false
let latinFonts: FontSet = { regular: { family: 'Inter', style: 'Regular' }, medium: { family: 'Inter', style: 'Medium' }, semibold: { family: 'Inter', style: 'Semi Bold' }, bold: { family: 'Inter', style: 'Bold' } }
let cjkFonts: FontSet = latinFonts

function today(): string {
  const date = new Date(Date.now() + 8 * 60 * 60 * 1000)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function defaults(): LogDocument {
  const date = today()
  return { versionMode: 'auto', versionFormat: 'three', defaultVersionBump: 'minor', headerStyle: 'gradient', headerEnd: '#2B5DCF', outputVersionLimit: 0, showCreatedDate: true, showUpdatedDate: true, showEntryDates: true, showLatestVersion: false, showLatestRelease: true, entryOrder: 'latest', title: '設計版本發布說明', version: '', created: date, updated: date, showDraft: true, showDates: true, showVersions: true, theme: 'light', size: 'normal', accent: '#6651E8', entries: [{ title: '', description: '', version: '', author: '', link: '', updated: date, attachments: [], assets: [], tags: [], status: 'Draft', drApproved: '', rdDelivered: '', done: false, groups: [] }] }
}

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('紀錄資料格式不正確。')
  return value as Record<string, unknown>
}

function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string') throw new ValidationError(`${label}必須是文字。`)
  const result = value.trim()
  if (result.length > max) throw new ValidationError(`${label}最多 ${max} 個字元。`)
  return result
}

function dateValue(value: unknown, label: string, optional = false): string {
  const result = text(value, label, 10)
  if (optional && !result) return result
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) throw new ValidationError(`${label}請使用 YYYY-MM-DD。`)
  const [year, month, day] = result.split('-').map(Number)
  const parsed = new Date(`${result}T12:00:00`)
  if (year < 1900 || year > 9999 || parsed.getFullYear() !== year || parsed.getMonth() + 1 !== month || parsed.getDate() !== day) throw new ValidationError(`${label}不是有效的日期。`)
  return result
}

function urlValue(value: unknown, label: string): string {
  const result = text(value, label, 2048)
  // The plugin sandbox has no browser URL parser. The UI performs the full URL validation.
  if (result && !/^https?:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/i.test(result)) throw new ValidationError(`${label}請使用有效的 http:// 或 https:// 網址。`)
  if (result && /^https?:\/\/[^/]*@/i.test(result)) throw new ValidationError(`${label}不可包含帳號或密碼。`)
  return result
}

function booleanValue(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new ValidationError('顯示設定格式不正確。')
  return value
}

function assetValue(value: unknown): Asset {
  const a = object(value)
  if (typeof a.id !== 'string' || !/^[a-z0-9-]{16,80}$/.test(a.id)) throw new ValidationError('附件識別碼無效。')
  const name = text(a.name, '檔名', 180)
  if (!name || Array.from(name).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) || /[/\\‪-‮⁦-⁩]/.test(name)) throw new ValidationError('檔名包含不支援的控制字元或路徑。')
  if (/\.svgz?$/i.test(name)) throw new ValidationError('SVG 請先轉成 PNG。')
  if (a.kind !== 'image' && a.kind !== 'file') throw new ValidationError('附件類型無效。')
  if (typeof a.mime !== 'string' || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(a.mime) || a.mime.length > 100 || a.mime === 'image/svg+xml') throw new ValidationError('不支援此附件 MIME 類型；SVG 請先轉成 PNG。')
  if (typeof a.size !== 'number' || !Number.isInteger(a.size) || a.size < 1 || a.size > (a.kind === 'image' ? 4 * 1024 * 1024 : 32768)) throw new ValidationError('圖片最多 4 MiB；其他檔案最多 32 KiB。')
  if (typeof a.hash !== 'string' || (a.hash && !/^[a-f0-9]{40}$/i.test(a.hash))) throw new ValidationError('圖片識別碼無效。')
  if (a.kind === 'image' && (a.mime !== 'image/png' || typeof a.width !== 'number' || typeof a.height !== 'number' || !Number.isInteger(a.width) || !Number.isInteger(a.height) || a.width < 1 || a.height < 1 || a.width > 4096 || a.height > 4096 || a.width * a.height > 16000000)) throw new ValidationError('圖片需為 PNG，長寬最多 4096，最多 1600 萬像素。')
  if (a.kind === 'file' && (a.hash !== '' || a.width !== 0 || a.height !== 0 || !['text/plain', 'application/pdf', 'application/octet-stream'].includes(a.mime))) throw new ValidationError('檔案附件格式不正確。')
  return { id: a.id, kind: a.kind, name, mime: a.mime, size: a.size, hash: a.hash, width: a.width as number, height: a.height as number }
}

function checkBytes(asset: Asset, bytes: Uint8Array): void {
  if (bytes.length !== asset.size) throw new ValidationError('附件大小與實際資料不符，請重新選檔。')
  if (asset.kind === 'image' && [137, 80, 78, 71, 13, 10, 26, 10].some((byte, index) => bytes[index] !== byte)) throw new ValidationError('圖片資料不是有效的 PNG。')
  if (asset.kind === 'image') {
    const size = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    if (bytes.length < 24 || size.getUint32(16) !== asset.width || size.getUint32(20) !== asset.height) throw new ValidationError('PNG 圖片尺寸不符。')
  }
  if (asset.mime === 'application/pdf' && String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw new ValidationError('PDF 檔頭無效。')
  if (asset.kind === 'file' && /<svg[\s>]/i.test(String.fromCharCode(...bytes.slice(0, 4096)))) throw new ValidationError('SVG 請先轉成 PNG。')
}

function documentAssets(document: { entries: LogEntry[] }): Asset[] {
  return document.entries.reduce<Asset[]>((all, entry) => all.concat(entry.assets ?? []), [])
}

async function assetBytes(asset: Asset, source: FrameNode | null): Promise<Uint8Array> {
  const pending = staged.get(asset.id)
  if (pending) {
    if (asset.hash || JSON.stringify(pending.asset) !== JSON.stringify(asset)) throw new ValidationError('暫存附件資料不符；原卡片不會被取代。')
    return pending.bytes
  }
  const document = source && readDocument(source)
  const saved = document && documentAssets(document).find((item) => item.id === asset.id)
  if (!saved || JSON.stringify(saved) !== JSON.stringify(asset)) throw new ValidationError('附件來源已遺失，請回到原卡片讀取或改用連結；原卡片不會被取代。')
  const bytes = asset.kind === 'image' ? await figma.getImageByHash(asset.hash)?.getBytesAsync() : figma.base64Decode(source!.getPluginData(ASSET_KEY + asset.id))
  if (!bytes?.length) throw new ValidationError('無法讀取附件。跨檔案複製可能未保留附件資料；原卡片保持不變。')
  // Figma may re-encode images; binary files retain their exact bytes.
  if (asset.kind === 'file') checkBytes(asset, bytes)
  return bytes
}

function changeItem(value: unknown, label: string): ChangeItem {
  const item = typeof value === 'string' ? { text: value, url: '' } : object(value)
  text(item.text, `${label}條列內容`, 4000)
  const url = urlValue(item.url, `${label}連結`)
  if (url && !(item.text as string).trim()) throw new ValidationError(`${label}有連結，請填寫條列文字或移除連結。`)
  return { text: item.text as string, url }
}

function normalizeDocument(value: unknown): Record<string, unknown> {
  const data = object(value)
  if (data.updated !== undefined) return data
  // Migrate only the missing document date; existing dates remain authoritative.
  let updated = ''
  if (Array.isArray(data.entries)) {
    for (const item of data.entries) {
      try {
        const entry = object(item)
        for (const candidate of [entry.updated, entry.created, entry.date]) {
          try {
            const date = dateValue(candidate, '紀錄更新日期')
            if (date > updated) updated = date
            break
          } catch { /* Try the older entry date fields without changing saved content. */ }
        }
      } catch { /* Ignore invalid candidates; normal validation still checks the entries. */ }
    }
  }
  if (!updated) {
    try { updated = dateValue(data.created, '建立日期', true) } catch { /* Leave unknown legacy dates blank. */ }
  }
  return { ...data, updated }
}

function entryStatus(entry: { status?: unknown; tags?: unknown }): LogEntry['status'] {
  if (entry.status !== undefined) {
    if (entry.status === '' || STATUSES.some((status) => status === entry.status)) return entry.status as LogEntry['status']
    throw new ValidationError('紀錄狀態請選擇 Draft、In Review、Released 或 Deprecated。')
  }
  const matches = STATUSES.filter((status) => Array.isArray(entry.tags) && entry.tags.includes(status))
  // Ambiguous legacy labels remain readable, but require an explicit choice on save.
  return matches.length === 1 ? matches[0] : ''
}

function validateDocument(value: unknown, requireStatus = false): LogDocument {
  const data = normalizeDocument(value)
  if (!Array.isArray(data.entries) || data.entries.length < 1) throw new ValidationError('請至少保留一筆版本紀錄。')
  if (data.theme !== 'light' && data.theme !== 'dark') throw new ValidationError('請選擇淺色或深色主題。')
  if (data.size !== 'normal' && data.size !== 'compact') throw new ValidationError('請選擇一般或精簡尺寸。')
  if (data.entryOrder !== undefined && data.entryOrder !== 'latest' && data.entryOrder !== 'manual') throw new ValidationError('請選擇最新版本優先或自訂順序。')
  const versionMode = data.versionMode === undefined ? 'auto' : data.versionMode
  const versionFormat = data.versionFormat === undefined ? 'three' : data.versionFormat
  const defaultVersionBump = data.defaultVersionBump === undefined ? 'minor' : data.defaultVersionBump
  if (versionMode !== 'manual' && versionMode !== 'auto') throw new ValidationError('請選擇手動輸入或自動遞增版號。')
  if (versionFormat !== 'two' && versionFormat !== 'three') throw new ValidationError('請選擇兩段式或三段式版號。')
  if (defaultVersionBump !== 'major' && defaultVersionBump !== 'minor' && defaultVersionBump !== 'patch') throw new ValidationError('請選擇 Major、Minor 或 Patch。')
  const outputVersionLimit = data.outputVersionLimit === undefined ? 0 : data.outputVersionLimit
  if (![0, 10, 20, 30].includes(outputVersionLimit as number)) throw new ValidationError('請選擇全部或最近 10、20、30 筆輸出版本。')
  const accent = text(data.accent, '重點色', 7)
  if (!/^#[0-9a-f]{6}$/i.test(accent)) throw new ValidationError('重點色請使用六位 HEX 色碼。')
  const headerStyle = data.headerStyle === undefined ? 'gradient' : data.headerStyle
  if (headerStyle !== 'solid' && headerStyle !== 'gradient') throw new ValidationError('表頭顏色請選擇單色或漸層。')
  const headerEnd = text(data.headerEnd === undefined ? '#2B5DCF' : data.headerEnd, '漸層結束色', 7)
  if (!/^#[0-9a-f]{6}$/i.test(headerEnd)) throw new ValidationError('漸層結束色請使用六位 HEX 色碼。')
  const entries = data.entries.map((item, index): LogEntry => {
    const entry = object(item)
    const label = `版本 ${index + 1}・`
    if (!Array.isArray(entry.tags) || entry.tags.length > TAGS.length || !entry.tags.every((tag) => typeof tag === 'string' && TAGS.includes(tag))) throw new ValidationError(`${label}的標籤不正確。`)
    const status = entryStatus(entry)
    if (requireStatus && !status) throw new ValidationError(`${label}的舊標籤尚未確認紀錄狀態，請單選 Draft、In Review、Released 或 Deprecated；舊標籤仍保留。`)
    if (!Array.isArray(entry.attachments) || entry.attachments.length > 5) throw new ValidationError(`${label}最多 5 個附件網址。`)
    const rawAssets = entry.assets === undefined ? [] : entry.assets
    if (!Array.isArray(rawAssets) || rawAssets.length > 6) throw new ValidationError(`${label}最多 6 個上傳附件。`)
    const assets = rawAssets.map(assetValue)
    const rawGroups = entry.groups === undefined ? [] : entry.groups
    if (!Array.isArray(rawGroups) || rawGroups.length > MAX_GROUPS) throw new ValidationError(`${label}最多 30 組變更項目。`)
    const groups = rawGroups.map((item, groupIndex): ChangeGroup => {
      const group = object(item)
      const groupLabel = `${label}變更項目 ${String(groupIndex + 1).padStart(2, '0')}・`
      const type = group.type === 'Bug fix' ? 'Fixed' : group.type
      if (type !== '' && type !== 'New' && type !== 'Feature' && type !== 'Updated' && type !== 'Fixed' && type !== 'Removed') throw new ValidationError(`${groupLabel}請選擇 New、Feature、Updated、Bug fix、Removed 或「無（不顯示）」。`)
      text(group.title, `${groupLabel}項目名稱`, 200)
      if (!Array.isArray(group.items)) throw new ValidationError(`${groupLabel}條列內容格式不正確。`)
      const items = group.items.map((line, itemIndex) => changeItem(line, `${groupLabel}條列 ${itemIndex + 1} `))
      text(items.map((item) => item.text).join('\n'), `${groupLabel}條列內容`, 4000)
      if (group.type && !(group.title as string).trim() && !items.some((item) => item.text.trim())) throw new ValidationError(`${groupLabel}已選類型，請填寫項目名稱或條列內容，或移除類型。`)
      return { type, title: group.title as string, items }
    })
    const drApproved = typeof entry.drApproved === 'string' ? entry.drApproved : ''
    const rdDelivered = typeof entry.rdDelivered === 'string' ? entry.rdDelivered : ''
    return { title: text(entry.title, `${label}標題`, 200), description: text(entry.description, `${label}描述`, 4000), version: text(entry.version, `${label}版本`, 80), author: text(entry.author, `${label}撰寫者`, 120), link: urlValue(entry.link, `${label}連結`), updated: dateValue(entry.updated, `${label}更新日期`), attachments: entry.attachments.map((url) => urlValue(url, `${label}附件`)).filter(Boolean), assets, tags: [...entry.tags] as string[], status, drApproved, rdDelivered, done: booleanValue(entry.done), groups }
  })
  const assets = documentAssets({ entries })
  if (assets.length > 24 || new Set(assets.map((asset) => asset.id)).size !== assets.length) throw new ValidationError('整張卡片最多 24 個上傳附件，且不可重複識別碼。')
  if (assets.filter((a) => a.kind === 'file').reduce((sum, a) => sum + a.size, 0) > 131072 || assets.filter((a) => a.kind === 'image').reduce((sum, a) => sum + a.size, 0) > 16 * 1024 * 1024) throw new ValidationError('整張卡片圖片合計最多 16 MiB；其他檔案合計最多 128 KiB。')
  return { versionMode: versionMode as LogDocument['versionMode'], versionFormat: versionFormat as LogDocument['versionFormat'], defaultVersionBump: defaultVersionBump as LogDocument['defaultVersionBump'], headerStyle: headerStyle as LogDocument['headerStyle'], headerEnd: headerEnd.toUpperCase(), outputVersionLimit: outputVersionLimit as LogDocument['outputVersionLimit'], showCreatedDate: data.showCreatedDate === undefined ? booleanValue(data.showDates) : booleanValue(data.showCreatedDate), showUpdatedDate: data.showUpdatedDate === undefined ? booleanValue(data.showDates) : booleanValue(data.showUpdatedDate), showEntryDates: data.showEntryDates === undefined ? booleanValue(data.showDates) : booleanValue(data.showEntryDates), showLatestVersion: false, showLatestRelease: data.showLatestRelease === undefined ? true : booleanValue(data.showLatestRelease), entryOrder: 'latest', title: text(data.title, '紀錄標題', 200) || '未命名設計紀錄', version: text(data.version, '文件版本', 80), created: dateValue(data.created, '建立日期', true), updated: dateValue(data.updated, '文件更新日期', true), showDraft: booleanValue(data.showDraft), showDates: booleanValue(data.showDates), showVersions: true, theme: data.theme, size: data.size, accent: accent.toUpperCase(), entries }
}

const HISTORY_DATA_PREFIX = 'design-log-history-'
let historyWriteSequence = 0
function readStoredDocument(node: FrameNode): Record<string, unknown> {
  const saved = object(JSON.parse(node.getPluginData(DATA_KEY)))
  if (saved.schema !== 2) return saved
  if (!Array.isArray(saved.chunks) || !saved.chunks.length || !saved.chunks.every(key => typeof key === 'string' && key.startsWith(HISTORY_DATA_PREFIX))) throw new ValidationError('歷史資料索引無效，原卡片保持不變。')
  const serialized = (saved.chunks as string[]).map(key => {
    const chunk = node.getPluginData(key)
    if (!chunk) throw new ValidationError('歷史資料不完整，原卡片保持不變。')
    return chunk
  }).join('')
  return object(JSON.parse(serialized))
}
function writeStoredDocument(node: FrameNode, serialized: string, writtenKeys: string[]): void {
  const generation = Date.now().toString(36) + '-' + (++historyWriteSequence).toString(36)
  for (let offset = 0; offset < serialized.length;) {
    const key = HISTORY_DATA_PREFIX + generation + '-' + writtenKeys.length
    if (node.getPluginData(key)) throw new ValidationError('歷史儲存鍵衝突，請重試。')
    writtenKeys.push(key)
    let end = Math.min(serialized.length, offset + 16000)
    const last = serialized.charCodeAt(end - 1)
    if (end < serialized.length && last >= 0xD800 && last <= 0xDBFF) end -= 1
    node.setPluginData(key, serialized.slice(offset, end))
    offset = end
  }
  // Publish the new index only after every history chunk has been written.
  node.setPluginData(DATA_KEY, JSON.stringify({ schema: 2, chunks: writtenKeys }))
}
function outputEntries(document: LogDocument): LogEntry[] {
  const ordered = latestEntries(document.entries)
  return document.outputVersionLimit ? ordered.slice(0, document.outputVersionLimit) : ordered
}

function readDocument(node: FrameNode): LogDocument | null {
  try {
    const saved = readStoredDocument(node)
    if (saved.schema !== 1) return null
    const document = validateDocument(saved.document)
    document.entries = latestEntries(document.entries)
    return document
  } catch {
    return null
  }
}

function selectedRoot(): FrameNode | null {
  const selection = figma.currentPage.selection
  if (selection.length !== 1) return null
  let node: BaseNode | null = selection[0]
  for (let depth = 0; node && depth < 64; depth += 1) {
    if (node.type === 'FRAME' && node.getPluginData(ROOT_KEY) === '1') return node
    node = node.parent
  }
  return null
}

function checkUpdate(root: FrameNode): void {
  let ancestor: BaseNode | null = root
  for (let depth = 0; ancestor && depth < 64; depth += 1) {
    if ('locked' in ancestor && ancestor.locked) throw new ValidationError('請先解鎖紀錄卡片及其上層圖層。')
    ancestor = ancestor.parent
  }
  if (root.width < 320 || root.width > 2000) throw new ValidationError('更新卡片的寬度需介於 320 與 2000。')
  const stack = root.children.filter((child) => child.getPluginData(OWN_KEY) === '1')
  for (let index = 0; index < stack.length; index += 1) {
    if (index >= 10000) throw new ValidationError('卡片內容過多，請改為建立新卡片。')
    const node = stack[index]
    if (node.locked) throw new ValidationError('請先解鎖卡片內由 plugin 產生的圖層。')
    if ('children' in node && node.type !== 'INSTANCE') {
      for (const child of node.children) {
        if (child.getPluginData(OWN_KEY) !== '1') throw new ValidationError('紀錄內容內有額外圖層。請先將它移到卡片外或根層，再更新；plugin 不會刪除額外圖層。')
        stack.push(child)
      }
    }
  }
}

function selectionState(): void {
  if (executing) return
  const root = selectedRoot()
  const document = root ? readDocument(root) : null
  figma.ui.postMessage({ type: 'selection', targetId: document && root ? root.id : null, name: root?.name ?? '', document, invalid: Boolean(root && !document) })
}

function rgb(hex: string): RGB {
  return { r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255 }
}

function solid(color: RGB): SolidPaint {
  return { type: 'SOLID', color }
}

function luminance(color: RGB): number {
  const linear = (channel: number): number => channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  return linear(color.r) * 0.2126 + linear(color.g) * 0.7152 + linear(color.b) * 0.0722
}

function timelineColor(accent: RGB): RGB {
  let color = { ...accent }
  // Keep accent markers visible on both card themes without altering the saved accent.
  for (let step = 0; step < 24; step += 1) {
    const light = luminance(color)
    if (light >= 0.12 && light <= 0.175) break
    const target = light < 0.12 ? 1 : 0
    color = { r: color.r * 0.88 + target * 0.12, g: color.g * 0.88 + target * 0.12, b: color.b * 0.88 + target * 0.12 }
  }
  return color
}

function statusColors(tag: string, dark: boolean): { background: RGB; foreground: RGB; border: RGB } {
  const lightPalette: Record<string, readonly [string, string]> = {
    Draft: ['#EFF0F4', '#626B7B'],
    'In Review': ['#E8EFFA', '#4B6899'],
    Released: ['#E4F4EC', '#287654'],
    Deprecated: ['#F8E9EC', '#A24B60'],
  }
  const darkPalette: Record<string, readonly [string, string]> = {
    Draft: ['#343A46', '#B9C3D4'],
    'In Review': ['#283B55', '#9EC4F4'],
    Released: ['#203D35', '#80D4AD'],
    Deprecated: ['#482D38', '#F0A3B6'],
  }
  const palette = dark ? darkPalette : lightPalette
  const [background, foreground] = palette[tag] || palette.Draft
  return { background: rgb(background), foreground: rgb(foreground), border: rgb(background) }
}

function displayVersion(value: string): string {
  const version = value.trim()
  // Add a prefix only to numeric versions; preserve already-prefixed and named versions.
  return /^\d/.test(version) ? `v${version}` : version
}

function changeColors(type: ChangeGroup['type'], dark: boolean): { background: RGB; foreground: RGB } {
  const lightPalette: Record<string, readonly [string, string]> = {
    New: ['#E8EFF3', '#496D83'],
    Updated: ['#EEEAF2', '#746481'],
    Fixed: ['#E8F0EC', '#507767'],
    Feature: ['#ECEAF8', '#5B53A6'],
    Removed: ['#F3E9EB', '#98636E'],
  }
  const darkPalette: Record<string, readonly [string, string]> = {
    New: ['#263B48', '#93C8E8'],
    Updated: ['#393047', '#C9A9E8'],
    Fixed: ['#293E36', '#9BD8B5'],
    Feature: ['#302E4D', '#B7B0F2'],
    Removed: ['#493139', '#E8A6B2'],
  }
  const palette = dark ? darkPalette : lightPalette
  const key = type || 'New'
  const [background, foreground] = palette[key] || palette.New
  return { background: rgb(background), foreground: rgb(foreground) }
}

function latestEntries(entries: LogEntry[]): LogEntry[] {
  const numeric = (raw: string): number[] | null => {
    const match = raw.trim().match(/^v?(\d+(?:\.\d+)*)(?:-([0-9A-Za-z.-]+))?$/i)
    return match ? match[1].split('.').map(Number) : null
  }
  return entries.map((entry, index) => ({ entry, index })).sort((a, b) => {
    const av = numeric(a.entry.version), bv = numeric(b.entry.version)
    if (av && bv) {
      for (let i = 0; i < Math.max(av.length, bv.length); i++) {
        const delta = (bv[i] || 0) - (av[i] || 0)
        if (delta) return delta
      }
      const ap = a.entry.version.includes('-'), bp = b.entry.version.includes('-')
      if (ap !== bp) return ap ? 1 : -1
    } else if (av || bv) return av ? -1 : 1
    return b.entry.updated.localeCompare(a.entry.updated) || a.index - b.index
  }).map(({ entry }) => entry)
}

function displayDate(value: string): string {
  if (!value.trim()) return ''
  const [year, month, day] = value.split('-').map(Number)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day} ${months[month - 1]} ${year}`
}

function owned<T extends SceneNode>(node: T): T {
  node.setPluginData(OWN_KEY, '1')
  return node
}

async function loadFontSet(available: readonly Font[], families: readonly string[], name: string): Promise<FontSet> {
  for (const family of families) {
    const styles = available.filter((font) => font.fontName.family === family).map((font) => font.fontName)
    const regular = styles.find((font) => /^(regular|normal|book|400)$/i.test(font.style)) ?? styles.find((font) => !/italic|oblique/i.test(font.style))
    if (!regular) continue
    const bold = styles.find((font) => /^(bold|700)$/i.test(font.style)) ?? styles.find((font) => /^(semibold|semi bold|demibold|medium)$/i.test(font.style)) ?? regular
    const semibold = styles.find((font) => /^(semibold|semi bold|demibold|demi bold|600)$/i.test(font.style)) ?? bold
    const medium = styles.find((font) => /^(medium|500)$/i.test(font.style)) ?? semibold
    try {
      const fonts = [regular, medium, semibold, bold].filter((font, index, all) => all.findIndex((item) => item.style === font.style) === index)
      await Promise.all(fonts.map((font) => figma.loadFontAsync(font)))
      return { regular, medium, semibold, bold }
    } catch {
      // An advertised local font may not be available to this plugin session.
    }
  }
  throw new ValidationError(`無法載入${name}字型。請確認可用的字型後重試；原卡片不會被修改。`)
}

async function loadRenderFonts(): Promise<void> {
  const available = await figma.listAvailableFontsAsync()
  const [latin, cjk] = await Promise.all([
    loadFontSet(available, ['Inter', 'Roboto', 'Noto Sans', 'Arial'], '英文'),
    loadFontSet(available, ['Noto Sans TC', 'Noto Sans CJK TC', 'Source Han Sans TW', 'Source Han Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'Noto Sans SC', 'Noto Sans CJK SC', 'Source Han Sans CN', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans JP', 'Noto Sans CJK JP', 'Noto Sans KR', 'Arial Unicode MS'], '中文')
  ])
  latinFonts = latin
  cjkFonts = cjk
}

function layout(name: string, width: number, gap: number, horizontal = false): FrameNode {
  const frame = owned(figma.createFrame())
  frame.name = name
  frame.fills = []
  frame.strokes = []
  frame.layoutMode = horizontal ? 'HORIZONTAL' : 'VERTICAL'
  frame.resize(width, 1)
  frame.layoutSizingHorizontal = 'FIXED'
  frame.layoutSizingVertical = 'HUG'
  frame.primaryAxisAlignItems = 'MIN'
  frame.counterAxisAlignItems = 'MIN'
  frame.paddingLeft = frame.paddingRight = frame.paddingTop = frame.paddingBottom = 0
  frame.itemSpacing = gap
  frame.clipsContent = false
  return frame
}

function label(parent: FrameNode, characters: string, width: number, size: number, color: RGB, weight: keyof FontSet = 'regular', hug = false, lineHeight = 1.5): TextNode {
  const node = owned(figma.createText())
  node.name = characters.slice(0, 60) || 'Text'
  const fonts = /[⺀-鿿가-힯豈-﫿＀-￯]/.test(characters) ? cjkFonts : latinFonts
  node.fontName = fonts[weight]
  node.fontSize = size
  node.lineHeight = { unit: 'PIXELS', value: Math.ceil(size * lineHeight) }
  node.textAlignHorizontal = 'LEFT'
  node.textAlignVertical = 'TOP'
  node.textTruncation = 'DISABLED'
  node.maxLines = null
  node.textAutoResize = 'NONE'
  node.resize(Math.max(1, width), Math.ceil(size * lineHeight))
  node.characters = characters
  node.fills = [solid(color)]
  parent.appendChild(node)
  // Establish width before enabling auto-height; never resize a measured label to 1px.
  node.textAutoResize = hug ? 'WIDTH_AND_HEIGHT' : 'HEIGHT'
  node.layoutSizingHorizontal = hug ? 'HUG' : parent.layoutMode === 'VERTICAL' ? 'FILL' : 'FIXED'
  node.layoutSizingVertical = 'HUG'
  if (hug) {
    const naturalWidth = node.width
    node.maxWidth = width
    if (naturalWidth > width) {
      node.textAutoResize = 'NONE'
      node.resize(width, node.height)
      node.textAutoResize = 'HEIGHT'
      node.layoutSizingHorizontal = 'FIXED'
    }
  }
  return node
}

function badge(parent: FrameNode, value: string, scale: number, background: RGB, foreground: RGB, border?: RGB): FrameNode {
  const chip = layout(value, 80, 0, true)
  chip.layoutSizingHorizontal = 'HUG'
  chip.paddingLeft = chip.paddingRight = Math.max(9, 10 * scale)
  chip.paddingTop = chip.paddingBottom = Math.max(3, 4 * scale)
  chip.counterAxisAlignItems = 'CENTER'
  chip.cornerRadius = 999
  chip.fills = [solid(background)]
  if (border) { chip.strokes = [solid(border)]; chip.strokeWeight = 1 }
  chip.maxWidth = parent.width
  label(chip, value, parent.width - chip.paddingLeft - chip.paddingRight, Math.max(11, 12 * scale), foreground, 'medium', true, 1.5)
  parent.appendChild(chip)
  return chip
}

function divider(parent: FrameNode, name: string, width: number, color: RGB): void {
  const line = owned(figma.createRectangle())
  line.name = name
  line.resize(width, 1)
  line.fills = [solid(color)]
  parent.appendChild(line)
  line.layoutSizingHorizontal = 'FILL'
  line.layoutSizingVertical = 'FIXED'
}

function timelineRule(parent: FrameNode, color?: RGB): void {
  const line = owned(figma.createRectangle())
  line.name = color ? 'Timeline rule' : 'Timeline spacer'
  line.resize(1, 1)
  line.fills = color ? [solid(color)] : []
  parent.appendChild(line)
  line.layoutSizingHorizontal = 'FIXED'
  line.layoutSizingVertical = 'FILL'
}


type ChangeLibrary = { variants: Map<string, ComponentNode>; nameKey: string; descriptionKey: string; showNameKey: string; showDescriptionKey: string }

function changeLibrary(parent: FrameNode, width: number, scale: number, dark: boolean, foreground: RGB, muted: RGB): ChangeLibrary {
  // Component conversion may change Figma selection. Preserve it during this
  // synchronous construction so save does not mistake our own changes for a user action.
  const selectionBeforeComponents = [...figma.currentPage.selection]
  try {
  // Keep masters with their card so copying it also preserves local components.
  const masters = layout('Design Release Notes / Component masters (hidden)', width, 16)
  parent.appendChild(masters)
  masters.visible = false
  const types = ['', 'New', 'Feature', 'Updated', 'Fixed', 'Removed']
  const variants = new Map<string, ComponentNode>()
  const names: TextNode[] = []
  const descriptions: TextNode[] = []
  for (const [index, type] of types.entries()) {
    const frame = layout('Change item', width, 8 * scale)
    masters.appendChild(frame)
    const heading = layout('Change type and name', width, 12 * scale, true)
    frame.appendChild(heading)
    heading.layoutSizingHorizontal = 'FILL'
    heading.counterAxisAlignItems = 'MIN'
    if (type) {
      const colors = changeColors(type as ChangeGroup['type'], dark)
      const chip = badge(heading, type === 'Fixed' ? 'Bug fix' : type, scale, colors.background, colors.foreground)
      chip.maxWidth = width
    }
    const name = label(heading, 'Change name', Math.max(1, width - 100 * scale), 16 * scale, foreground, 'semibold')
    name.layoutSizingHorizontal = 'FILL'
    const description = label(frame, 'Description', width, 14 * scale, muted)
    const component = owned(figma.createComponentFromNode(frame))
    component.name = 'Type=' + (type || 'None')
    component.description = 'Design Release Notes change item. Duplicate instances in a log entry; edit Change name and Description without detaching.'
    component.x = 0
    component.y = index * 120 * scale
    variants.set(type, component)
    names.push(name)
    descriptions.push(description)
  }
  const set = owned(figma.combineAsVariants([...variants.values()], masters))
  set.name = 'Design Release Notes / Change Item'
  set.description = 'New, Feature, Updated, Bug fix and Removed; None omits the badge.'
  const nameKey = set.addComponentProperty('Change name', 'TEXT', 'Change name')
  const descriptionKey = set.addComponentProperty('Description', 'TEXT', 'Description')
  const showNameKey = set.addComponentProperty('Show name', 'BOOLEAN', true)
  const showDescriptionKey = set.addComponentProperty('Show description', 'BOOLEAN', true)
  names.forEach(node => { node.componentPropertyReferences = { characters: nameKey, visible: showNameKey } })
  descriptions.forEach(node => { node.componentPropertyReferences = { characters: descriptionKey, visible: showDescriptionKey } })
  return { variants, nameKey, descriptionKey, showNameKey, showDescriptionKey }
  } finally {
    const currentSelection = figma.currentPage.selection
    const retained = selectionBeforeComponents.filter(node => !node.removed)
    if (currentSelection.length !== retained.length || currentSelection.some((node, index) => node.id !== retained[index]?.id)) {
      figma.currentPage.selection = retained
    }
  }
}

let invalidHyperlinkCount = 0
function applyHyperlink(node: TextNode, url: string): void {
  try {
    node.hyperlink = { type: 'URL', value: url.trim() }
    node.textDecoration = 'UNDERLINE'
  } catch {
    invalidHyperlinkCount += 1
    node.setPluginData('original-link-url', url)
    node.characters = 'Link needs review'
    node.textDecoration = 'NONE'
  }
}

function changeInstance(parent: FrameNode, library: ChangeLibrary, group: ChangeGroup, scale: number, dark: boolean, muted: RGB): void {
  const master = library.variants.get(group.type) || library.variants.get('')!
  const instance = owned(master.createInstance())
  instance.name = 'Change Item / ' + (group.title || group.type || 'Description')
  const items = group.items.filter(item => item.text.trim())
  const linked = items.some(item => item.url)
  const lines = items.map(item => (items.length > 1 ? '• ' : '') + item.text)
  instance.setProperties({
    [library.nameKey]: group.title,
    [library.descriptionKey]: lines.join('\n'),
    [library.showNameKey]: Boolean(group.title.trim()),
    [library.showDescriptionKey]: Boolean(lines.length) && !linked
  })
  const section = layout(instance.name, parent.width, 8 * scale)
  parent.appendChild(section)
  section.layoutSizingHorizontal = 'FILL'
  section.appendChild(instance)
  instance.layoutSizingHorizontal = 'FILL'
  instance.layoutSizingVertical = 'HUG'
  if (!linked) return
  const rows = layout('Change descriptions and links', parent.width, 6 * scale)
  section.appendChild(rows)
  rows.layoutSizingHorizontal = 'FILL'
  for (const [index, item] of items.entries()) {
    const row = layout('Change description', parent.width, 12 * scale, true)
    rows.appendChild(row)
    row.layoutSizingHorizontal = 'FILL'
    row.counterAxisAlignItems = 'MIN'
    const body = label(row, lines[index], Math.max(1, parent.width - (item.url ? 64 * scale : 0)), 14 * scale, muted)
    body.layoutSizingHorizontal = 'FILL'
    if (item.url) {
      const link = label(row, '↗ Link', 52 * scale, 12 * scale, rgb(dark ? '#8ACFFF' : '#087ABF'), 'medium', true)
      applyHyperlink(link, item.url)
      link.lineHeight = body.lineHeight
    }
  }
}

async function renderDocument(document: LogDocument, width: number): Promise<FrameNode> {
  await loadRenderFonts()
  const scale = document.size === 'compact' ? 0.84 : 1
  const entryTitleSize = Math.max(16, 18 * scale)
  const dark = document.theme === 'dark'
  const background = rgb(dark ? '#202126' : '#FFFFFF')
  const foreground = rgb(dark ? '#F3F4F7' : '#24272A')
  const muted = rgb(dark ? '#A8ADBB' : '#69758B')
  const border = rgb(dark ? '#3B3E49' : '#EDF0F5')
  const accent = rgb(document.accent)
  const timelineLine = rgb(dark ? '#484B59' : '#EDF0F5')
  const timelineAccent = dark ? rgb('#8066EB') : timelineColor(accent)
  const padding = 24 * scale
  const inside = width - padding * 2
  const content = layout('Design Release Notes content', width, 0)
  content.visible = false
  content.fills = [solid(background)]
  content.cornerRadius = 12 * scale
  content.clipsContent = true
  try {
    const changeComponents = changeLibrary(content, inside - 24 * scale, scale, dark, foreground, muted)
    const header = layout('Design Release Notes header', width, 8 * scale)
    header.paddingLeft = header.paddingRight = padding
    header.paddingTop = header.paddingBottom = 16 * scale
    header.itemSpacing = 4 * scale
    content.appendChild(header)
    header.layoutSizingHorizontal = 'FILL'
    let start = { ...accent }
    let end = document.headerEnd ? rgb(document.headerEnd) : { r: accent.r * 0.3 + 0.07, g: accent.g * 0.3 + 0.31, b: accent.b * 0.3 + 0.63 }
    for (let step = 0; step < 24; step += 1) {
      if (luminance(start) > 0.16) start = { r: start.r * 0.9, g: start.g * 0.9, b: start.b * 0.9 }
      if (luminance(end) > 0.16) end = { r: end.r * 0.9, g: end.g * 0.9, b: end.b * 0.9 }
    }
    header.fills = document.headerStyle === 'solid' ? [solid(start)] : [{ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { ...start, a: 1 } }, { position: 1, color: { ...end, a: 1 } }] }]
    label(header, 'Design Release Notes', inside, 14 * scale, rgb('#FFFFFF'), 'medium')
    label(header, document.title, inside, Math.max(24, 28 * scale), rgb('#FFFFFF'), 'semibold')
    const latestRelease = latestEntries(document.entries).find(entry => entry.status === 'Released')
    const created = document.showCreatedDate ? displayDate(document.created) : ''
    const updated = document.showUpdatedDate ? displayDate(document.updated) : ''
    const showDocumentInfo = document.showDraft
    if (showDocumentInfo) {
      const info = layout('Version info', width, 16 * scale)
      info.paddingLeft = info.paddingRight = padding
      info.paddingTop = info.paddingBottom = 24 * scale
      content.appendChild(info)
      info.layoutSizingHorizontal = 'FILL'
      label(info, '01 / RELEASE INFO', inside, 18 * scale, foreground, 'semibold')
      for (const [caption, entry] of [['Latest Release', latestRelease]] as const) {
        if (caption === 'Latest Release' && !document.showLatestRelease) continue
        const block = layout(caption, inside, 4 * scale)
        info.appendChild(block)
        block.layoutSizingHorizontal = 'FILL'
        label(block, caption, inside, 12 * scale, muted)
        if (!entry) {
          label(block, 'No release yet', inside, 18 * scale, foreground, 'medium')
          continue
        }
        const row = layout(caption + ' and status', inside, 12 * scale, true)
        block.appendChild(row)
        row.layoutSizingHorizontal = 'FILL'
        row.counterAxisAlignItems = 'CENTER'
        const version = document.showVersions ? displayVersion(entry.version) || 'No version' : entry.title || caption
        label(row, version, inside - 110 * scale, 28 * scale, foreground, 'semibold').layoutSizingHorizontal = 'FILL'
        const status = entryStatus(entry)
        if (status) { const colors = statusColors(status, dark); badge(row, status, scale, colors.background, colors.foreground) }
        const attribution = [document.showEntryDates ? displayDate(entry.updated) : '', entry.author].filter(Boolean).join(' · ')
        if (attribution) label(block, attribution, inside, 12 * scale, muted)
      }
      if (created || updated) {
        const metadata = layout('Document metadata', inside, 14 * scale)
        info.appendChild(metadata)
        metadata.layoutSizingHorizontal = 'FILL'
        divider(metadata, 'Version dates divider', inside, border)
        const fields = layout('Version dates', inside, 7 * scale)
        metadata.appendChild(fields)
        fields.layoutSizingHorizontal = 'FILL'
        for (const [name, value] of [['Created on', created], ['Updated on', updated]]) {
          if (!value) continue
          const row = layout(name, inside, 12 * scale, true)
          fields.appendChild(row)
          row.layoutSizingHorizontal = 'FILL'
          label(row, name, 100 * scale, 12 * scale, muted)
          const date = label(row, value, inside - 112 * scale, 12 * scale, muted)
          date.layoutSizingHorizontal = 'FILL'
          date.textAlignHorizontal = 'RIGHT'
        }
      }
      divider(content, 'Section divider', width, border)
    }
    const logs = layout('Changelog', width, 20 * scale)
    logs.paddingLeft = logs.paddingRight = padding
    logs.paddingTop = logs.paddingBottom = 24 * scale
    content.appendChild(logs)
    logs.layoutSizingHorizontal = 'FILL'
    const changelogHeading = layout('Changelog heading', inside, 8 * scale, true)
    logs.appendChild(changelogHeading)
    changelogHeading.layoutSizingHorizontal = 'FILL'
    changelogHeading.counterAxisAlignItems = 'CENTER'
    label(changelogHeading, (showDocumentInfo ? '02' : '01') + ' / CHANGELOG', inside - 80 * scale, 18 * scale, foreground, 'semibold').layoutSizingHorizontal = 'FILL'
    label(changelogHeading, 'Latest first', 74 * scale, 11 * scale, muted, 'regular', true)
    const history = layout('Timeline entries', inside, 0)
    logs.appendChild(history)
    history.layoutSizingHorizontal = 'FILL'
    const visibleEntries = outputEntries(document)
    for (let index = 0; index < visibleEntries.length; index += 1) {
      const entry = visibleEntries[index]
      const groups = (entry.groups ?? []).map((group) => ({ ...group, type: (String(group.type) === 'Bug fix' ? 'Fixed' : group.type) as ChangeGroup['type'] })).filter((group) => group.title.trim() || group.items.some((item) => changeItem(item, '條列').text.trim()))
      const version = document.showVersions ? displayVersion(entry.version) : ''
      const status = entryStatus(entry)
      const hasLead = Boolean(status)
      const final = index === visibleEntries.length - 1
      const entryWidth = inside - 24 * scale
      const log = layout(`Log ${index + 1}`, inside, 0)
      history.appendChild(log)
      log.layoutSizingHorizontal = 'FILL'
      const first = layout('Entry first row', inside, 12 * scale, true)
      log.appendChild(first)
      first.layoutSizingHorizontal = 'FILL'
      const marker = layout('Timeline marker', 12 * scale, 0)
      marker.counterAxisAlignItems = 'CENTER'
      first.appendChild(marker)
      marker.layoutSizingVertical = 'FILL'
      // Equal native fill segments center the dot on the actual wrapped first row.
      timelineRule(marker, index ? timelineLine : undefined)
      const dot = owned(figma.createEllipse())
      dot.name = 'Timeline dot'
      dot.resize(6 * scale, 6 * scale)
      dot.fills = [solid(timelineAccent)]
      marker.appendChild(dot)
      dot.layoutSizingHorizontal = dot.layoutSizingVertical = 'FIXED'
      timelineRule(marker, final ? undefined : timelineLine)
      const lead = layout('Version header', entryWidth, 8 * scale, true)
      lead.layoutWrap = 'WRAP'
      lead.counterAxisSpacing = 4 * scale
      lead.counterAxisAlignItems = 'CENTER'
      lead.counterAxisAlignContent = 'AUTO'
      first.appendChild(lead)
      lead.layoutSizingHorizontal = 'FILL'
      label(lead, version || entry.title || 'Untitled', Math.max(60, entryWidth - 100 * scale), version ? 24 * scale : entryTitleSize, foreground, 'semibold').layoutSizingHorizontal = 'FILL'
      if (status) {
        const colors = statusColors(status, dark)
        badge(lead, status, scale, colors.background, colors.foreground)
      }
      const attribution = [document.showEntryDates ? displayDate(entry.updated) : '', entry.author.trim()].filter(Boolean).join(' · ')
      if (hasLead || version || entry.description || groups.length || entry.link || entry.attachments.length || entry.assets?.length || attribution || !final) {
        const details = layout('Entry details row', inside, 12 * scale, true)
        log.appendChild(details)
        details.layoutSizingHorizontal = 'FILL'
        const rail = layout('Timeline continuation', 12 * scale, 0)
        rail.counterAxisAlignItems = 'CENTER'
        details.appendChild(rail)
        rail.layoutSizingVertical = 'FILL'
        timelineRule(rail, final ? undefined : timelineLine)
        const body = layout(`Entry ${index + 1}: ${entry.title || 'Untitled'}`, entryWidth, 12 * scale)
        details.appendChild(body)
        body.layoutSizingHorizontal = 'FILL'
        body.paddingTop = 4 * scale
        body.paddingBottom = final ? 0 : 16 * scale
        if (attribution) label(body, attribution, entryWidth, 12 * scale, muted)
        if ((version && entry.title) || entry.description) {
          const summary = layout('Release summary', entryWidth, 8 * scale)
          body.appendChild(summary)
          summary.layoutSizingHorizontal = 'FILL'
          if (version && entry.title) label(summary, entry.title, entryWidth, entryTitleSize, foreground, 'semibold')
          if (entry.description) label(summary, entry.description, entryWidth, 14 * scale, foreground)
        }
        if (groups.length) {
          const changes = layout('Change items', entryWidth, 16 * scale)
          body.appendChild(changes)
          changes.layoutSizingHorizontal = 'FILL'
          for (const group of groups) changeInstance(changes, changeComponents, group, scale, dark, muted)
        }
        if (entry.link || entry.attachments.length) {
          const links = layout('Reference links', entryWidth, 12 * scale, true)
          links.layoutWrap = 'WRAP'
          links.counterAxisSpacing = 10 * scale
          links.counterAxisAlignContent = 'AUTO'
          body.appendChild(links)
          links.layoutSizingHorizontal = 'FILL'
          for (const [title, url] of [
            ...(entry.link ? [['Open link ↗', entry.link]] : []),
            ...entry.attachments.map((url, attachment) => [`Attachment ${attachment + 1} ↗`, url])
          ]) {
            const link = label(links, title, entryWidth, 12 * scale, rgb(dark ? '#8ACFFF' : '#087ABF'), 'regular', true)
            applyHyperlink(link, url)
          }
        }
        if (entry.assets?.length) {
          const attachments = layout('Attachments', entryWidth, 8 * scale)
          body.appendChild(attachments)
          attachments.layoutSizingHorizontal = 'FILL'
          label(attachments, 'Uploaded attachments', entryWidth, 12 * scale, foreground, 'medium')
          const images = entry.assets.filter((asset) => asset.kind === 'image')
          if (images.length) {
            const grid = layout('Attachment image grid', entryWidth, 8 * scale, true)
            grid.layoutWrap = 'WRAP'
            grid.counterAxisSpacing = 8 * scale
            grid.counterAxisAlignContent = 'AUTO'
            attachments.appendChild(grid)
            grid.layoutSizingHorizontal = 'FILL'
            for (const asset of images) {
              const thumbnail = owned(figma.createRectangle())
              thumbnail.name = `Attachment image: ${asset.name}`
              thumbnail.resize(72 * scale, 88 * scale)
              thumbnail.cornerRadius = 4 * scale
              thumbnail.fills = [{ type: 'IMAGE', imageHash: asset.hash, scaleMode: 'FIT' }]
              grid.appendChild(thumbnail)
              thumbnail.layoutSizingHorizontal = thumbnail.layoutSizingVertical = 'FIXED'
            }
          }
          for (const asset of entry.assets.filter((item) => item.kind === 'file')) {
            const tile = layout(`Attachment file: ${asset.name}`, entryWidth, 2 * scale)
            tile.paddingLeft = tile.paddingRight = 8 * scale
            tile.paddingTop = tile.paddingBottom = 6 * scale
            tile.fills = [solid(border)]
            tile.cornerRadius = 4 * scale
            attachments.appendChild(tile)
            tile.layoutSizingHorizontal = 'FILL'
            label(tile, asset.name, entryWidth - 16 * scale, 12 * scale, foreground, 'medium')
            label(tile, `${asset.mime} · ${Math.ceil(asset.size / 1024)} KiB · Preview in plugin`, entryWidth - 16 * scale, 11 * scale, muted)
          }
        }
        if (!final) divider(body, 'Entry divider', entryWidth, border)
      }
    }
    return content
  } catch (error) {
    content.remove()
    throw error
  }
}

async function save(message: Extract<Message, { type: 'save' }>): Promise<void> {
  if (executing) return
  executing = true
  let rendered: FrameNode | null = null
  let storageRoot: FrameNode | null = null
  let createdRoot: FrameNode | null = null
  let previousData = ''
  const writtenHistoryKeys: string[] = []
  const previousFiles = new Map<string, string>()
  let previous: SceneNode[] = []
  try {
    const document = validateDocument(message.document, true)
    document.updated = today()
    document.entries = latestEntries(document.entries)
    let root = message.action === 'update' ? selectedRoot() : null
    if (message.action === 'update') {
      if (!root || root.id !== message.targetId || !readDocument(root)) throw new ValidationError('請選取要更新的 Design Release Notes 卡片，並載入它的資料。')
      checkUpdate(root)
    }
    const previousSize = root ? readDocument(root)?.size : undefined
    const width = root && previousSize === document.size ? root.width : document.size === 'compact' ? 360 : 420
    const source = message.targetId && documentAssets(document).length ? await figma.getNodeByIdAsync(message.targetId) : null
    const files = new Map<string, string>()
    for (const asset of documentAssets(document)) {
      const bytes = await assetBytes(asset, source?.type === 'FRAME' && source.getPluginData(ROOT_KEY) === '1' ? source : null)
      if (asset.kind === 'image') {
        if (!asset.hash) {
          const image = figma.createImage(bytes)
          const size = await image.getSizeAsync()
          if (size.width !== asset.width || size.height !== asset.height) throw new ValidationError('圖片尺寸驗證失敗。')
          asset.hash = image.hash
        }
      } else files.set(asset.id, figma.base64Encode(bytes))
    }
    const serialized = JSON.stringify({ schema: 1, document })
    invalidHyperlinkCount = 0
    rendered = await renderDocument(document, width)
    if (root) {
      if (root.removed || selectedRoot()?.id !== root.id) throw new ValidationError('選取的卡片已改變。請重新選取後再更新。')
      checkUpdate(root)
      storageRoot = root
      previousData = root.getPluginData(DATA_KEY)
      for (const [id, bytes] of files) {
        previousFiles.set(ASSET_KEY + id, root.getPluginData(ASSET_KEY + id))
        root.setPluginData(ASSET_KEY + id, bytes)
      }
      const transform = root.relativeTransform
      const oldHeight = root.height
      previous = root.children.filter((child) => child.getPluginData(OWN_KEY) === '1')
      const onlyOwnedContent = previous.length === root.children.length
      root.appendChild(rendered)
      rendered.x = rendered.y = 0
      root.resize(width, Math.max(oldHeight, rendered.height))
      root.relativeTransform = transform
      if (onlyOwnedContent && root.layoutMode === 'NONE') {
        root.layoutMode = 'VERTICAL'
        root.itemSpacing = 0
        root.paddingLeft = root.paddingRight = root.paddingTop = root.paddingBottom = 0
        root.resize(width, rendered.height)
      }
    } else {
      root = figma.createFrame()
      createdRoot = root
      for (const [id, bytes] of files) root.setPluginData(ASSET_KEY + id, bytes)
      root.fills = []
      root.clipsContent = false
      root.layoutMode = 'VERTICAL'
      root.resize(width, rendered.height)
      root.appendChild(rendered)
      rendered.x = rendered.y = 0
      root.itemSpacing = 0
      root.paddingLeft = root.paddingRight = root.paddingTop = root.paddingBottom = 0
    }
    rendered.visible = true
    if (root.layoutMode === 'VERTICAL') {
      root.layoutSizingHorizontal = 'FIXED'
      root.layoutSizingVertical = 'HUG'
      rendered.layoutSizingHorizontal = 'FILL'
      rendered.layoutSizingVertical = 'HUG'
    }
    if (message.action === 'create') {
      const center = figma.viewport.center
      root.x = center.x - root.width / 2
      root.y = center.y - root.height / 2
    }
    root.name = `Design Release Notes · ${document.title}`
    root.setPluginData(ROOT_KEY, '1')
    writeStoredDocument(root, serialized, writtenHistoryKeys)
    root.setRelaunchData({ [TOOL_ID]: DISPLAY_NAME })
    for (const child of previous) child.remove()
    const liveHistoryKeys = new Set(writtenHistoryKeys)
    for (const key of root.getPluginDataKeys()) {
      if (key.startsWith(HISTORY_DATA_PREFIX) && !liveHistoryKeys.has(key)) {
        try { root.setPluginData(key, '') } catch { /* Old unreferenced chunks can be cleaned on a later save. */ }
      }
    }
    const liveFiles = new Set(files.keys())
    for (const key of root.getPluginDataKeys()) {
      if (key.startsWith(ASSET_KEY) && !liveFiles.has(key.slice(ASSET_KEY.length))) {
        try { root.setPluginData(key, '') } catch { /* Retry non-destructive stale-byte cleanup on the next save. */ }
      }
    }
    figma.currentPage.selection = [root]
    if (message.action === 'create') figma.viewport.scrollAndZoomIntoView([root])
    figma.ui.postMessage({ type: 'saved', targetId: root.id, document, message: (message.action === 'create' ? '已建立可編輯的紀錄卡片。' : '已更新目前卡片，已套用外觀與尺寸設定。') + (invalidHyperlinkCount ? ` ${invalidHyperlinkCount} 個連結無法設定，已標記「Link needs review」；原網址保留在表單，請確認目的地是否仍存在。` : '') })
    rendered = null
  } catch (error) {
    if (rendered && !rendered.removed) rendered.remove()
    if (createdRoot && !createdRoot.removed) createdRoot.remove()
    if (storageRoot && !storageRoot.removed) {
      storageRoot.setPluginData(DATA_KEY, previousData)
      for (const key of writtenHistoryKeys) {
        try { storageRoot.setPluginData(key, '') } catch { /* Unreferenced chunks do not replace the saved history. */ }
      }
      for (const [key, value] of previousFiles) {
        if (storageRoot.getPluginData(key) !== value) storageRoot.setPluginData(key, value)
      }
    }
    const messageText = error instanceof Error ? error.message : String(error)
    figma.ui.postMessage({ type: 'error', message: messageText })
  } finally {
    executing = false
    selectionState()
  }
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const initialRoot = selectedRoot()
const initial = initialRoot && readDocument(initialRoot) || defaults()
// Added styles and scripts for the plugin UI (gzip, base64). The UI decompresses them on load.
const DRN_EXT = [
  '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',
].join('')
// UX reviews (2026-10): [find, replace] pairs from ui.html to the reviewed UI, gzip and base64.
// Each find occurs once. They are inflated here because the plugin sandbox has no DecompressionStream.
const DRN_PATCHES = [
  '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',
  'Zy730VKhQIwmt7Xx6vKgDxz4X5mq8qk0WwAA',
].join('')

function inflate(data: Uint8Array): Uint8Array {
  // Raw DEFLATE after the 10-byte gzip header (written without optional fields).
  let pos = 10, bit = 0
  const out: number[] = []
  const bits = (n: number): number => {
    let v = 0
    for (let i = 0; i < n; i++) {
      v |= ((data[pos] >> bit) & 1) << i
      if (++bit === 8) { bit = 0; pos++ }
    }
    return v
  }
  type Table = { counts: number[]; symbols: number[] }
  const table = (lengths: number[]): Table => {
    const counts = new Array(16).fill(0), offsets = new Array(16).fill(0), symbols: number[] = []
    for (const l of lengths) counts[l]++
    counts[0] = 0
    for (let i = 1; i < 15; i++) offsets[i + 1] = offsets[i] + counts[i]
    lengths.forEach((l, s) => { if (l) symbols[offsets[l]++] = s })
    return { counts, symbols }
  }
  const decode = (t: Table): number => {
    let code = 0, first = 0, index = 0
    for (let len = 1; len < 16; len++) {
      code |= bits(1)
      const count = t.counts[len]
      if (code - count < first) return t.symbols[index + code - first]
      index += count
      first = (first + count) << 1
      code <<= 1
    }
    throw new Error('Invalid DEFLATE data')
  }
  const lengthBase: number[] = [], lengthExtra: number[] = [], distBase: number[] = [], distExtra: number[] = []
  for (let i = 0, b = 3; i < 28; i++) { lengthExtra[i] = i < 8 ? 0 : (i >> 2) - 1; lengthBase[i] = b; b += 1 << lengthExtra[i] }
  lengthBase[28] = 258; lengthExtra[28] = 0
  for (let i = 0, b = 1; i < 30; i++) { distExtra[i] = i < 4 ? 0 : (i >> 1) - 1; distBase[i] = b; b += 1 << distExtra[i] }
  const order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
  for (let last = 0; !last;) {
    last = bits(1)
    const type = bits(2)
    if (type === 0) {
      if (bit) { bit = 0; pos++ }
      const len = data[pos] | (data[pos + 1] << 8)
      pos += 4
      for (let i = 0; i < len; i++) out.push(data[pos++])
      continue
    }
    let lit: Table, dist: Table
    if (type === 1) {
      lit = table(Array.from({ length: 288 }, (_, i) => i < 144 ? 8 : i < 256 ? 9 : i < 280 ? 7 : 8))
      dist = table(new Array(30).fill(5))
    } else {
      const nlit = bits(5) + 257, ndist = bits(5) + 1, ncode = bits(4) + 4, codeLengths = new Array(19).fill(0)
      for (let i = 0; i < ncode; i++) codeLengths[order[i]] = bits(3)
      const codes = table(codeLengths), lengths: number[] = []
      while (lengths.length < nlit + ndist) {
        const s = decode(codes)
        if (s < 16) lengths.push(s)
        else {
          const [repeat, value] = s === 16 ? [3 + bits(2), lengths[lengths.length - 1]] : s === 17 ? [3 + bits(3), 0] : [11 + bits(7), 0]
          for (let r = 0; r < repeat; r++) lengths.push(value)
        }
      }
      lit = table(lengths.slice(0, nlit))
      dist = table(lengths.slice(nlit))
    }
    for (;;) {
      const s = decode(lit)
      if (s < 256) out.push(s)
      else if (s === 256) break
      else {
        const len = lengthBase[s - 257] + bits(lengthExtra[s - 257]), d = decode(dist), back = distBase[d] + bits(distExtra[d])
        for (let i = 0; i < len; i++) out.push(out[out.length - back])
      }
    }
  }
  return new Uint8Array(out)
}

function utf8(bytes: Uint8Array): string {
  let text = ''
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i++]
    const c = b < 0x80 ? b : b < 0xe0 ? (b & 31) << 6 | bytes[i++] & 63 : b < 0xf0 ? (b & 15) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63 : (b & 7) << 18 | (bytes[i++] & 63) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63
    text += String.fromCodePoint(c)
  }
  return text
}

// Toast fixes: hide the lock toast when that version is unlocked in its card, and keep toasts above the footer.
const DRN_TOAST_FIX = `<script>(()=>{const D=document;D.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.drn-lock button'),t=D.getElementById('drn-toast');if(b&&t&&!t.hidden&&t.querySelector('button')?.textContent===b.textContent)t.hidden=true},true);const place=()=>{const t=D.getElementById('drn-toast');if(!t||t.hidden)return;let y=innerHeight;for(const s of ['.za','.zx']){const r=D.querySelector(s)?.getBoundingClientRect();if(r&&r.height)y=Math.min(y,r.top)}t.style.bottom=Math.max(12,innerHeight-y+12)+'px'};new MutationObserver(place).observe(D.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']})})()</script>`

let html = __html__
try {
  const UI_PATCHES: Array<[string, string]> = JSON.parse(utf8(inflate(figma.base64Decode(DRN_PATCHES))))
  for (const [find, replacement] of UI_PATCHES) html = html.split(find).join(replacement)
  html = html.split('%DRN_EXT%').join(DRN_EXT)
  const end = html.lastIndexOf('</body>')
  if (end >= 0) html = html.slice(0, end) + DRN_TOAST_FIX + html.slice(end)
} catch (error) {
  // Open the original UI rather than failing to open the plugin.
  console.error('Design Release Notes: UI patches failed', error)
  html = __html__
}
for (const [id, value] of [['title', initial.title], ['version', initial.version], ['created', initial.created], ['updated', initial.updated], ['theme', initial.theme === 'dark' ? '深色' : '淺色'], ['size', initial.size === 'compact' ? '精簡' : '一般'], ['accent', initial.accent]]) {
  html = html.replace(new RegExp(`(id="${id}"[^>]*\\bvalue=")[^"]*(")`), (_match: string, prefix: string, suffix: string) => prefix + escapeAttribute(value) + suffix)
}
for (const [id, checked] of [['showLatestRelease', initial.showLatestRelease], ['showDraft', initial.showDraft], ['showCreatedDate', initial.showCreatedDate], ['showUpdatedDate', initial.showUpdatedDate], ['showEntryDates', initial.showEntryDates]] as const) {
  html = html.replace(new RegExp(`(id="${id}"[^>]*\\bchecked=")[^"]*(")`), '$1' + String(checked) + '$2')
}
figma.showUI(html, { width: 520, height: 800, themeColors: true })
figma.on('selectionchange', selectionState)
figma.ui.onmessage = async (message: Message): Promise<void> => {
  if (message.type === 'upload' || message.type === 'asset') {
    try {
      if (executing) throw new ValidationError('儲存中，請稍後再讀取附件。')
      if (message.type === 'upload') {
        // Keep old staged/saved assets resolvable, but never accept new binary uploads.
        throw new ValidationError('附件僅接受連結，請填寫 HTTP(S) 網址；既有上傳附件仍保留。')
      } else {
        const source = message.sourceId ? await figma.getNodeByIdAsync(message.sourceId) : null
        const root = source?.type === 'FRAME' && source.getPluginData(ROOT_KEY) === '1' ? source : null
        const document = root && readDocument(root)
        const asset = staged.get(message.id)?.asset ?? (document && documentAssets(document).find((item) => item.id === message.id))
        if (!asset) throw new ValidationError('無法找到附件，請回到原卡片讀取；原資料仍保留。')
        const bytes = await assetBytes(asset, root)
        figma.ui.postMessage({ type: 'asset-result', requestId: message.requestId, asset, bytes })
      }
    } catch (error) {
      figma.ui.postMessage({ type: 'asset-result', requestId: message.requestId, error: error instanceof Error ? error.message : String(error) })
    }
  } else if (message.type === 'release') {
    for (const id of message.ids) staged.delete(id)
  } else if (message.type === 'resize') {
    if (Number.isFinite(message.height)) figma.ui.resize(520, Math.max(600, Math.min(900, Math.round(message.height))))
  } else if (message.type === 'ready') {
    const root = selectedRoot()
    const document = root ? readDocument(root) : null
    figma.ui.postMessage({ type: 'restore', targetId: document && root ? root.id : null, document: document ?? defaults() })
    selectionState()
  } else if (message.type === 'save' && (message.action === 'create' || message.action === 'update')) {
    await save(message)
  }
}
