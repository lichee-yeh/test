type UA=Uint8Array;const UA=Uint8Array;
type Obj=Record<string,unknown>;
type StrMap=Record<string,string>;
type S=string;type Num=number;type Bool=boolean;
const TI='f1f27f78-9161-49b6-a93a-bb0722076c90'
const DN='Design Release Notes'
const RK='design-log-root'
const OW='design-log-owned'
const DK='design-log-document'
const TAGS=['Feature','Proposed','Updated','In progress','Draft','Beta','Released','Removed','Deprecated','Bug fix','Web','Mobile','Tablet']
const ST=['Draft','In Review','Released','Deprecated']as const
const MG=30
type CI={text:S;url:S}
type Group={type:''|'New'|'Feature'|'Updated'|'Fixed'|'Removed';title:S;items:CI[]}
type As={id:S;kind:'image'|'file';name:S;mime:S;size:Num;hash:S;width:Num;height:Num}
const AK='design-log-asset-'
type En={rid?:S;born?:Num;title:S;description:S;version:S;author:S;link:S;resourceNames?:StrMap;resources?:Array<{name:S;url:S}>;updated:S;attachments:S[];assets:As[];tags:S[];status:''|typeof ST[number];drApproved:S;rdDelivered:S;done:Bool;groups:Group[]}
type ProjectResource={type:S;name:S;url:S}
type Doc={projectResources?:ProjectResource[];company?:S;category?:S;latestId?:S;versionMode:'manual'|'auto';versionFormat:'two'|'three';defaultVersionBump:'major'|'minor'|'patch';headerStyle:'solid'|'gradient';headerEnd:S;outputVersionLimit:0|10|20|30;showCreatedDate:Bool;showUpdatedDate:Bool;showEntryDates:Bool;showLatestVersion:Bool;showLatestRelease:Bool;showUnreleased:Bool;showCoverVersion?:Bool;entryOrder:'latest'|'manual';designer:S;resourceLocale?:'zh'|'en';title:S;version:S;created:S;updated:S;showDraft:Bool;showDates:Bool;showVersions:Bool;theme:'light'|'dark';size:'normal'|'compact';accent:S;entries:En[]}
type Msg={type:'delete-check';requestId:S;targetId:S;rid:S;count:Num;unlockedIds:S[]}|{type:'ready'}|{type:'resize';height:Num}|{type:'save';action:'create'|'update';targetId:S|null;document:unknown;unlockedIds?:S[]}|{type:'asset';requestId:S;sourceId:S|null;id:S}
type FS={regular:FontName;medium:FontName;semibold:FontName;bold:FontName}
class VE extends Error{}
let ex=false
let zA:FS={regular:{family:'Inter',style:'Regular'},medium:{family:'Inter',style:'Medium'},semibold:{family:'Inter',style:'Semi Bold'},bold:{family:'Inter',style:'Bold'}}
let zB:FS=zA
function today():S{
const date=new Date(Date.now()+ 8*60*60*1000)
return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}
function defaults():Doc{
const date=today()
return{versionMode:'auto',versionFormat:'three',defaultVersionBump:'minor',headerStyle:'gradient',headerEnd:'#2B5DCF',outputVersionLimit:0,showCreatedDate:true,showUpdatedDate:true,showEntryDates:true,showLatestVersion:false,showLatestRelease:true,showUnreleased:false,entryOrder:'latest',designer:'',title:'設計版本發布說明',version:'',created:date,updated:date,showDraft:true,showDates:true,showVersions:true,theme:'light',size:'normal',accent:'#6651E8',entries:[{title:'',description:'',version:'',author:'',link:'',updated:date,attachments:[],assets:[],tags:[],status:'Draft',drApproved:'',rdDelivered:'',done:false,groups:[]}]}
}
function object(value:unknown):Obj{
if(value===null||typeof value!=='object'||Array.isArray(value))throw new VE('紀錄資料格式不正確。')
return value as Obj
}
function text(value:unknown,label:S,max:Num):S{
if (typeof value !== 'string') throw new VE(`${label}必須是文字。`)
const result=value.trim()
if (result.length > max) throw new VE(`${label}最多 ${max} 個字元。`)
return result
}
function ct0(value:unknown,label:S,optional=false):S{
const result=text(value,label,10)
if(optional&&!result)return result
if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) throw new VE(`${label}請使用 YYYY-MM-DD。`)
const[year,month,day]=result.split('-').map(Number)
const parsed = new Date(`${result}T12:00:00`)
if (year < 1900 || year > 9999 || parsed.getFullYear() !== year || parsed.getMonth() + 1 !== month || parsed.getDate() !== day) throw new VE(`${label}不是有效的日期。`)
return result
}
function ct1(value:unknown,label:S):S{
const result=text(value,label,2048)
if (result && !/^https?:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/i.test(result)) throw new VE(`${label}請使用有效的 http:// 或 https:// 網址。`)
if (result && /^https?:\/\/[^/]*@/i.test(result)) throw new VE(`${label}不可包含帳號或密碼。`)
return result
}
function fn0(value:unknown):Bool{
if(typeof value!=='boolean')throw new VE('顯示設定格式不正確。')
return value
}
function ct2(value:unknown):As{
const a=object(value)
if (typeof a.id !== 'string' || !/^[a-z0-9-]{16,80}$/.test(a.id)) throw new VE('附件識別碼無效。')
const name=text(a.name,'檔名',180)
if (!name || Array.from(name).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) || /[/\\‪-‮⁦-⁩]/.test(name)) throw new VE('檔名包含不支援的控制字元或路徑。')
if (/\.svgz?$/i.test(name)) throw new VE('SVG 請先轉成 PNG。')
if(a.kind!=='image'&&a.kind!=='file')throw new VE('附件類型無效。')
if (typeof a.mime !== 'string' || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(a.mime) || a.mime.length > 100 || a.mime === 'image/svg+xml') throw new VE('不支援此附件 MIME 類型；SVG 請先轉成 PNG。')
if(typeof a.size!=='number'||!Number.isInteger(a.size)||a.size < 1||a.size >(a.kind==='image' ? 4*1024*1024:32768))throw new VE('圖片最多 4 MiB；其他檔案最多 32 KiB。')
if (typeof a.hash !== 'string' || (a.hash && !/^[a-f0-9]{40}$/i.test(a.hash))) throw new VE('圖片識別碼無效。')
if (a.kind === 'image' && (a.mime !== 'image/png' || typeof a.width !== 'number' || typeof a.height !== 'number' || !Number.isInteger(a.width) || !Number.isInteger(a.height) || a.width < 1 || a.height < 1 || a.width > 4096 || a.height > 4096 || a.width * a.height > 16000000)) throw new VE('圖片需為 PNG，長寬最多 4096，最多 1600 萬像素。')
if (a.kind === 'file' && (a.hash !== '' || a.width !== 0 || a.height !== 0 || !['text/plain', 'application/pdf', 'application/octet-stream'].includes(a.mime))) throw new VE('檔案附件格式不正確。')
return{id:a.id,kind:a.kind,name,mime:a.mime,size:a.size,hash:a.hash,width:a.width as number,height:a.height as number}
}
function ct3(asset:As,bytes:UA):void{
if(bytes.length!==asset.size)throw new VE('附件大小與實際資料不符，請重新選檔。')
if (asset.mime === 'application/pdf' && String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw new VE('PDF 檔頭無效。')
if (asset.kind === 'file' && /<svg[\s>]/i.test(String.fromCharCode(...bytes.slice(0, 4096)))) throw new VE('SVG 請先轉成 PNG。')
}
function fn1(document:{entries:En[]}):As[]{
return document.entries.reduce<As[]>((all,entry)=>all.concat(entry.assets ??[]),[])
}
async function ct4(asset:As,source:FrameNode | null):Promise<UA>{
const document=source&&fn8(source)
const saved=document&&fn1(document).find((item)=>item.id===asset.id)
if(!saved||JSON.stringify(saved)!==JSON.stringify(asset))throw new VE('附件來源已遺失，請回到原卡片讀取或改用連結；原卡片不會被取代。')
const bytes=asset.kind==='image' ? await figma.getImageByHash(asset.hash)?.getBytesAsync():figma.base64Decode(source!.getPluginData(AK + asset.id))
if(!bytes?.length)throw new VE('無法讀取附件。跨檔案複製可能未保留附件資料；原卡片保持不變。')
if(asset.kind==='file')ct3(asset,bytes)
return bytes
}
function ct5(value:unknown,label:S):CI{
const item=typeof value==='string' ?{text:value,url:''}:object(value)
text(item.text, `${label}條列內容`, 4000)
const url = ct1(item.url, `${label}連結`)
if (url && !(item.text as string).trim()) throw new VE(`${label}有連結，請填寫條列文字或移除連結。`)
return{text:item.text as string,url}
}
function fn2(value:unknown):Obj{
const data=object(value)
if(data.updated!==undefined)return data
let updated=''
if(Array.isArray(data.entries)){
for(const item of data.entries){
try{
const entry=object(item)
for(const candidate of[entry.updated,entry.created,entry.date]){
try{
const date=ct0(candidate,'紀錄更新日期')
if(date > updated)updated=date
break
} catch { /* Try the older entry date fields without changing saved content. */ }
}
} catch { /* Ignore invalid candidates; normal validation still checks the entries. */ }
}
}
if(!updated){
try { updated = ct0(data.created, '建立日期', true) } catch { /* Leave unknown legacy dates blank. */ }
}
return{...data,updated}
}
function fn3(entry:{status?:unknown;tags?:unknown}):En['status']{
if(entry.status!==undefined){
if(entry.status===''||ST.some((status)=>status===entry.status))return entry.status as En['status']
throw new VE('紀錄狀態請選擇 Draft、In Review 或 Released。')
}
const matches=ST.filter((status)=>Array.isArray(entry.tags)&&entry.tags.includes(status))
return matches.length===1 ? matches[0]:''
}
function validProjectUrl(url:S):Bool{
return url.length<=2048 && /^https?:\/\/[^\s/@?#]+(?:[/?#][^\s]*)?$/i.test(url)
}
function fn4(value:unknown,requireStatus=false):Doc{
const data=fn2(value)
if(!Array.isArray(data.entries)||data.entries.length < 1)throw new VE('請至少保留一筆版本紀錄。')
if(data.theme!=='light'&&data.theme!=='dark')throw new VE('請選擇淺色或深色主題。')
if(data.size!=='normal'&&data.size!=='compact')throw new VE('請選擇一般或精簡尺寸。')
if(data.entryOrder!==undefined&&data.entryOrder!=='latest'&&data.entryOrder!=='manual')throw new VE('請選擇最新版本優先或自訂順序。')
const versionMode=data.versionMode===undefined ? 'auto':data.versionMode
const versionFormat=data.versionFormat===undefined ? 'three':data.versionFormat
const defaultVersionBump=data.defaultVersionBump===undefined ? 'minor':data.defaultVersionBump
if(versionMode!=='manual'&&versionMode!=='auto')throw new VE('請選擇手動輸入或自動遞增版號。')
if(versionFormat!=='two'&&versionFormat!=='three')throw new VE('請選擇兩段式或三段式版號。')
if(defaultVersionBump!=='major'&&defaultVersionBump!=='minor'&&defaultVersionBump!=='patch')throw new VE('請選擇 Major、Minor 或 Patch。')
const outputVersionLimit=data.outputVersionLimit===undefined ? 0:data.outputVersionLimit
if(![0,10,20,30].includes(outputVersionLimit as number))throw new VE('請選擇全部或最近 10、20、30 筆輸出版本。')
const accent=text(data.accent,'主色',7)
if (!/^#[0-9a-f]{6}$/i.test(accent)) throw new VE('主色請使用六位 HEX 色碼。')
const headerStyle=data.headerStyle===undefined ? 'gradient':data.headerStyle
if(headerStyle!=='solid'&&headerStyle!=='gradient')throw new VE('表頭顏色請選擇單色或漸層。')
const headerEnd=text(data.headerEnd===undefined ? '#2B5DCF':data.headerEnd,'漸層結束色',7)
if (!/^#[0-9a-f]{6}$/i.test(headerEnd)) throw new VE('漸層結束色請使用六位 HEX 色碼。')
const entries=data.entries.map((item,index):En=>{
const entry=object(item)
const label = `版本 ${index + 1}・`
if (!Array.isArray(entry.tags) || entry.tags.length > TAGS.length || !entry.tags.every((tag) => typeof tag === 'string' && TAGS.includes(tag))) throw new VE(`${label}的標籤不正確。`)
const status=fn3(entry)
if (requireStatus && !status) throw new VE(`${label}的舊標籤尚未確認紀錄狀態，請單選 Draft、In Review 或 Released；舊標籤仍保留。`)
if (!Array.isArray(entry.attachments) || entry.attachments.length > 5) throw new VE(`${label}最多 5 個附件網址。`)
const rawAssets=entry.assets===undefined ?[]:entry.assets
if (!Array.isArray(rawAssets) || rawAssets.length > 6) throw new VE(`${label}最多 6 個上傳附件。`)
const assets=rawAssets.map(ct2)
const rawGroups=entry.groups===undefined ?[]:entry.groups
if (!Array.isArray(rawGroups) || rawGroups.length > MG) throw new VE(`${label}最多 30 組變更項目。`)
const groups=rawGroups.map((item,groupIndex):Group=>{
const group=object(item)
const groupLabel = `${label}變更項目 ${String(groupIndex + 1).padStart(2, '0')}・`
const type=group.type==='Bug fix' ? 'Fixed':group.type
if (type !== '' && type !== 'New' && type !== 'Feature' && type !== 'Updated' && type !== 'Fixed' && type !== 'Removed') throw new VE(`${groupLabel}請選擇 New、Feature、Updated、Bug fix、Removed 或「無（不顯示）」。`)
text(group.title, `${groupLabel}變更主題`, 200)
if (!Array.isArray(group.items)) throw new VE(`${groupLabel}條列內容格式不正確。`)
const items = group.items.map((line, itemIndex) => ct5(line, `${groupLabel}條列 ${itemIndex + 1} `))
text(items.map((item) => item.text).join('\n'), `${groupLabel}條列內容`, 4000)
if (group.type && !(group.title as string).trim() && !items.some((item) => item.text.trim())) throw new VE(`${groupLabel}已選類型，請填寫變更主題或條列內容，或移除類型。`)
return{type,title:group.title as string,items}
})
const drApproved=typeof entry.drApproved==='string' ? entry.drApproved:''
const rdDelivered=typeof entry.rdDelivered==='string' ? entry.rdDelivered:''
const legacyNames=entry.resourceNames===undefined ?{}:object(entry.resourceNames)
const rawResources=entry.resources===undefined ?[entry.link,...entry.attachments].filter((url):url is string=>typeof url==='string'&&Boolean(url.trim())).map(url=>({url,name:legacyNames[url.trim()]?? ''})):entry.resources
if(!Array.isArray(rawResources)||rawResources.length > 6)throw new VE('每版最多 6 筆相關資源。')
const resources=rawResources.map(value=>{const item=object(value);return{name:text(item.name ?? '','資源名稱',120),url:ct1(item.url,'連結')}}).filter(item=>item.url)
return {rid:typeof entry.rid==='string'&&entry.rid?text(entry.rid,'版本識別',160):requireStatus?'n'+Date.now().toString(36)+Math.random().toString(36).slice(2):'l'+index+':'+String(entry.version),born:typeof entry.born==='number'&&Number.isFinite(entry.born)&&entry.born>0?entry.born:undefined,resources, title: text(entry.title, `${label}標題`, 200), description: text(entry.description, `${label}描述`, 4000), version: text(entry.version, `${label}版本`, 80), author: text(entry.author, `${label}設計師`, 120), link: resources[0]?.url || '', updated: ct0(entry.updated, `${label}更新日期`), attachments: resources.slice(1).map(item => item.url), assets, tags: [...entry.tags] as string[], status, drApproved, rdDelivered, done: fn0(entry.done), groups }
})
const assets=fn1({entries})
if(assets.length > 24||new Set(assets.map((asset)=>asset.id)).size!==assets.length)throw new VE('整張卡片最多 24 個上傳附件，且不可重複識別碼。')
if(assets.filter((a)=>a.kind==='file').reduce((sum,a)=>sum + a.size,0)> 131072||assets.filter((a)=>a.kind==='image').reduce((sum,a)=>sum + a.size,0)> 16*1024*1024)throw new VE('整張卡片圖片合計最多 16 MiB；其他檔案合計最多 128 KiB。')
const kinds:Record<string,string>={figma:'figma',prototype:'figma',library:'figma',spec:'spec',notion:'spec',handoff:'spec',folder:'folder',video:'video',image:'image',car:'car',star:'star'}
const legacy=typeof data.documentLinks==='string'?data.documentLinks.split(/\r?\n/).filter(line=>line.trim()).map(line=>{
const at=line.lastIndexOf('|')
return {type:'external',name:at<0?'':line.slice(0,at).trim(),url:(at<0?line:line.slice(at+1)).trim()}
}):[]
const seen=new Set<S>()
const projectResources=(Array.isArray(data.projectResources)?data.projectResources:legacy).map(item=>{
const row=fn2(item)
const name=typeof row.name==='string'?row.name.trim():''
const url=typeof row.url==='string'?row.url.trim():''
if(requireStatus&&(name||url)){
if(!name||name.length>120)throw new VE('請填寫資源名稱（最多 120 字）。')
if(!validProjectUrl(url))throw new VE('請輸入有效的 HTTP 或 HTTPS 網址。')
if(seen.has(url))throw new VE('此網址已新增。')
seen.add(url)
}
return {type:Object.prototype.hasOwnProperty.call(kinds,String(row.type))?kinds[String(row.type)]:'external',name,url}
}).filter(row=>row.name||row.url)
return{projectResources,company:data.company===undefined?'':text(data.company,'公司／事業單位',160),category:data.category===undefined?'':text(data.category,'產品類別',160),latestId:typeof data.latestId==='string'?text(data.latestId,'版本識別',160):undefined,versionMode:versionMode as Doc['versionMode'],versionFormat:versionFormat as Doc['versionFormat'],defaultVersionBump:defaultVersionBump as Doc['defaultVersionBump'],headerStyle:headerStyle as Doc['headerStyle'],headerEnd:headerEnd.toUpperCase(),outputVersionLimit:outputVersionLimit as Doc['outputVersionLimit'],showCreatedDate:false,showUpdatedDate:data.showUpdatedDate===undefined ? fn0(data.showDates):fn0(data.showUpdatedDate),showEntryDates:true,showLatestVersion:false,showLatestRelease:data.showLatestRelease===undefined ? true:fn0(data.showLatestRelease),showUnreleased:data.showUnreleased===undefined ? false:fn0(data.showUnreleased),showCoverVersion:data.showCoverVersion!==false,entryOrder:'latest',resourceLocale:data.resourceLocale==='en' ? 'en':'zh',designer:data.designer===undefined ? '':text(data.designer,'設計師名稱',120),title:text(data.title,'紀錄標題',200),version:text(data.version,'文件版本',80),created:ct0(data.created,'建立日期',true),updated:ct0(data.updated,'文件更新日期',true),showDraft:fn0(data.showDraft),showDates:fn0(data.showDates),showVersions:true,theme:data.theme,size:'normal',accent:accent.toUpperCase(),entries}
}
const HP='design-log-history-'
let hs=0
function fn5(zQ:FrameNode):Obj{
const saved=object(JSON.parse(zQ.getPluginData(DK)))
if(saved.schema!==2)return saved
if(!Array.isArray(saved.chunks)||!saved.chunks.length||!saved.chunks.every(key=>typeof key==='string'&&key.startsWith(HP)))throw new VE('歷史資料索引無效，原卡片保持不變。')
const zH=(saved.chunks as string[]).map(key=>{
const chunk=zQ.getPluginData(key)
if(!chunk)throw new VE('歷史資料不完整，原卡片保持不變。')
return chunk
}).join('')
return object(JSON.parse(zH))
}
function fn6(zQ:FrameNode,zH:S,wk:S[]):void{
const generation=Date.now().toString(36)+ '-' +(++hs).toString(36)
for(let offset=0;offset < zH.length;){
const key=HP + generation + '-' + wk.length
if(zQ.getPluginData(key))throw new VE('歷史儲存鍵衝突，請重試。')
wk.push(key)
let end=Math.min(zH.length,offset + 16000)
const last=zH.charCodeAt(end - 1)
if(end < zH.length&&last>=0xD800&&last<=0xDBFF)end -=1
zQ.setPluginData(key,zH.slice(offset,end))
offset=end
}
zQ.setPluginData(DK,JSON.stringify({schema:2,chunks:wk}))
}
const SS:readonly string[]=['Released','Deprecated']
function fn7(document:Doc):En[]{
const ordered=fn15(document.entries).filter((entry)=>document.showUnreleased||entry.status==='In Review'||SS.includes(entry.status))
return document.outputVersionLimit ? ordered.slice(0,document.outputVersionLimit):ordered
}
function fn8(zQ:FrameNode):Doc | null{
try{
const saved=fn5(zQ)
if(saved.schema!==1)return null
const document=fn4(saved.document)
document.entries=fn15(document.entries)
return document
}catch{
return null
}
}
function fn9():FrameNode | null{
const selection=figma.currentPage.selection
if(selection.length!==1)return null
let zQ:BaseNode | null=selection[0]
for(let depth=0;zQ&&depth < 64;depth +=1){
if(zQ.type==='FRAME'&&zQ.getPluginData(RK)==='1')return zQ
zQ=zQ.parent
}
return null
}
function fn10(rt:FrameNode):void{
let ancestor:BaseNode | null=rt
for(let depth=0;ancestor&&depth < 64;depth +=1){
if('locked' in ancestor&&ancestor.locked)throw new VE('請先解鎖紀錄卡片及其上層圖層。')
ancestor=ancestor.parent
}
if(rt.width < 320||rt.width > 2000)throw new VE('更新卡片的寬度需介於 320 與 2000。')
const stack=rt.children.filter((child)=>child.getPluginData(OW)==='1'&&!isCover(child))
for(let index=0;index < stack.length;index +=1){
if(index>=10000)throw new VE('卡片內容過多，請改為建立新卡片。')
const zQ=stack[index]
if(zQ.locked)throw new VE('請先解鎖卡片內由 plugin 產生的圖層。')
if('children' in zQ&&zQ.type!=='INSTANCE'){
for(const child of zQ.children){
if(isCover(child))continue;
const legacyLinkVector=child.type==='VECTOR'&&child.name==='Vector'&&
zQ.type==='FRAME'&&zQ.children.length===1&&
((zQ.name==='Link icon'&&zQ.parent?.name==='Link')||
(zQ.name==='External link icon'&&zQ.parent?.name==='External link'))
if(child.getPluginData(OW)!=='1'&&!legacyLinkVector)throw new VE('紀錄內容內有額外圖層「'+child.name+'」。請先移到卡片外或根層，再更新。')
stack.push(child)
}
}
}
}
function fn11():void{
if(ex)return
const rt=fn9()
const document=rt ? fn8(rt):null
figma.ui.postMessage({type:'selection',targetId:document&&rt ? rt.id:null,name:rt?.name ?? '',document,invalid:Boolean(rt&&!document)})
}
function rgb(hex:S):RGB{
return { r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255 }
}
function solid(color:RGB):SolidPaint{
return{type:'SOLID',color}
}
function fn12(tag:S,dark:Bool):{bg:RGB;fg:RGB}{
const pl:Record<string,[string,string]>=dark?{'Draft':['#343A46','#C5CEDC'],'Released':['#203D35','#9BE0BA'],'Deprecated':['#482D38','#F6B8C8']}:{'Draft':['#EFF0F4','#454E5D'],'Released':['#E4F4EC','#18563B'],'Deprecated':['#F8E9EC','#7E2D45']}
const pair=pl[tag]||pl.Draft
return{bg:rgb(pair[0]),fg:rgb(pair[1])}
}
function fn13(value:S):S{
const version=value.trim()
return /^\d/.test(version) ? `v${version}` : version
}
function fn14(type:Group['type'],dark:Bool):{bg:RGB;fg:RGB}{
const pl:Record<string,[string,string]>=dark?{'New':['#335571','#EDF9FF'],'Updated':['#43536B','#F4F8FF'],'Fixed':['#385947','#F0FFF6'],'Feature':['#60487D','#FAF3FF'],'Removed':['#873143','#FFF3F4']}:{'New':['#D5EAF8','#16435E'],'Updated':['#C6D8EF','#25374D'],'Fixed':['#D3EBDE','#20513D'],'Feature':['#E2D6F7','#4C2D80'],'Removed':['#F4DCE5','#752840']}
const pair=pl[type||'New']||pl.New
return{bg:rgb(pair[0]),fg:rgb(pair[1])}
}
function fn15(entries:En[]):En[]{
const numeric=(raw:S):Num[]| null=>{
const match = raw.trim().match(/^v?(\d+(?:\.\d+)*)(?:-([0-9A-Za-z.-]+))?$/i)
return match ? match[1].split('.').map(Number):null
}
return entries.map((entry,index)=>({entry,index})).sort((a,b)=>{
const av=numeric(a.entry.version),bv=numeric(b.entry.version)
if(av&&bv){
for(let i=0;i < Math.max(av.length,bv.length);i++){
const delta=(bv[i]||0)-(av[i]||0)
if(delta)return delta
}
const ap=a.entry.version.includes('-'),bp=b.entry.version.includes('-')
if(ap!==bp)return ap ? 1:-1
}else if(av||bv)return av ? -1:1
return b.entry.updated.localeCompare(a.entry.updated)||a.index - b.index
}).map(({entry})=>entry)
}
function fn16(value:S):S{
if(!value.trim())return ''
const[year,month,day]=value.split('-').map(Number)
return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
}
function owned<T extends SceneNode>(zQ:T):T{
zQ.setPluginData(OW,'1')
return zQ
}
async function fn17(zO:readonly Font[],families:readonly string[],name:S):Promise<FS>{
for(const family of families){
const styles=zO.filter((font)=>font.fontName.family===family).map((font)=>font.fontName)
const regular = styles.find((font) => /^(regular|normal|book|400)$/i.test(font.style)) ?? styles.find((font) => !/italic|oblique/i.test(font.style))
if(!regular)continue
const bold = styles.find((font) => /^(bold|700)$/i.test(font.style)) ?? styles.find((font) => /^(semibold|semi bold|demibold|medium)$/i.test(font.style)) ?? regular
const semibold = styles.find((font) => /^(semibold|semi bold|demibold|demi bold|600)$/i.test(font.style)) ?? bold
const medium = styles.find((font) => /^(medium|500)$/i.test(font.style)) ?? semibold
try{
const fonts=[regular,medium,semibold,bold].filter((font,index,all)=>all.findIndex((item)=>item.style===font.style)===index)
await Promise.all(fonts.map((font)=>figma.loadFontAsync(font)))
return{regular,medium,semibold,bold}
}catch{
}
}
throw new VE(`無法載入${name}字型。請確認可用的字型後重試；原卡片不會被修改。`)
}
async function fn18():Promise<void>{
const zO=await figma.listAvailableFontsAsync()
const[latin,cjk]=await Promise.all([
fn17(zO,['Inter','Roboto','Noto Sans','Arial'],'英文'),
fn17(zO,['Noto Sans TC','Noto Sans CJK TC','Source Han Sans TW','Source Han Sans TC','PingFang TC','Microsoft JhengHei','Noto Sans SC','Noto Sans CJK SC','Source Han Sans CN','PingFang SC','Microsoft YaHei','Noto Sans JP','Noto Sans CJK JP','Noto Sans KR','Arial Unicode MS'],'中文')
])
zA=latin
zB=cjk
}
function layout(name:S,width:Num,gap:Num,horizontal=false):FrameNode{
const frame=owned(figma.createFrame())
frame.name=name
frame.fills=[]
frame.strokes=[]
frame.layoutMode=horizontal ? 'HORIZONTAL':'VERTICAL'
frame.resize(width,1)
frame.layoutSizingHorizontal='FIXED'
frame.layoutSizingVertical='HUG'
frame.primaryAxisAlignItems='MIN'
frame.counterAxisAlignItems='MIN'
frame.paddingLeft=frame.paddingRight=frame.paddingTop=frame.paddingBottom=0
frame.itemSpacing=gap
frame.clipsContent=false
return frame
}
function label(zR:FrameNode,characters:S,width:Num,size:Num,color:RGB,weight:keyof FS='regular',hug=false,lineHeight=1.5):TextNode{
const zQ=owned(figma.createText())
zQ.name=characters.slice(0,60)||'Text'
const fonts = /[⺀-鿿가-힯豈-﫿＀-￯]/.test(characters) ? zB : zA
zQ.fontName=fonts[weight]
zQ.fontSize=size
zQ.lineHeight={unit:'PIXELS',value:Math.ceil(size*lineHeight)}
zQ.textAlignHorizontal='LEFT'
zQ.textAlignVertical='TOP'
zQ.textTruncation='DISABLED'
zQ.maxLines=null
zQ.textAutoResize='NONE'
zQ.resize(Math.max(1,width),Math.ceil(size*lineHeight))
zQ.characters=characters
zQ.fills=[solid(color)]
zR.appendChild(zQ)
zQ.textAutoResize=hug ? 'WIDTH_AND_HEIGHT':'HEIGHT'
zQ.layoutSizingHorizontal=hug ? 'HUG':zR.layoutMode==='VERTICAL' ? 'FILL':'FIXED'
zQ.layoutSizingVertical='HUG'
if(hug){
const zN=zQ.width
zQ.maxWidth=width
if(zN > width){
zQ.textAutoResize='NONE'
zQ.resize(width,zQ.height)
zQ.textAutoResize='HEIGHT'
zQ.layoutSizingHorizontal='FIXED'
}
}
return zQ
}
function badge(zR:FrameNode,value:S,sc:Num,bg:RGB,fg:RGB,weight:'medium'|'semibold'='medium'):FrameNode{
const cp=layout(value,80*sc,0,true)
cp.layoutSizingHorizontal='HUG'
cp.paddingLeft=cp.paddingRight=Math.max(9,10*sc)
cp.paddingTop=cp.paddingBottom=Math.max(3,4*sc)
cp.counterAxisAlignItems='CENTER'
cp.cornerRadius=999
cp.fills=[solid(bg)]
cp.maxWidth=zR.width
const text=label(cp,value,zR.width-cp.paddingLeft-cp.paddingRight,Math.max(11,12*sc),fg,weight,true,1.5)
const textHeight=Math.ceil(Math.max(11,12*sc)*1.5)
text.textAutoResize='NONE'
text.resize(Math.ceil(text.width),textHeight)
text.layoutSizingHorizontal=text.layoutSizingVertical='FIXED'
text.textAlignVertical='CENTER'
cp.primaryAxisAlignItems='CENTER'
zR.appendChild(cp)
cp.resize(cp.width,Math.round(26*sc))
cp.layoutSizingVertical='FIXED'
return cp
}
type CL={variants:Map<string,ComponentNode>;nk:S;dk:S;sn:S;sd:S}
function fn19(zR:FrameNode,width:Num,sc:Num,dark:Bool,fg:RGB,mu:RGB):CL{
const sb=[...figma.currentPage.selection]
try{
const masters = layout('Design Release Notes / Component masters (hidden)', width, 16*sc)
zR.appendChild(masters)
masters.visible=false
const types=['','New','Updated','Fixed','Feature','Removed']
const variants=new Map<string,ComponentNode>()
const names:TextNode[]=[]
const descriptions:TextNode[]=[]
for(const[index,type]of types.entries()){
const frame=layout('Change item',width,12*sc)
masters.appendChild(frame)
const hd=layout('Change type and name',width,12*sc,true)
frame.appendChild(hd)
hd.layoutSizingHorizontal='FILL'
hd.counterAxisAlignItems='CENTER'
if(type){
const cs=fn14(type as Group['type'],dark)
const cp=badge(hd,type,sc,cs.bg,cs.fg,'semibold')
cp.maxWidth=width
}
const name=label(hd,'Change name',Math.max(1,width - 100*sc),16*sc,fg,'medium')
name.layoutSizingHorizontal='FILL'
const description=label(frame,'Description',width,16*sc,mu)
const co=owned(figma.createComponentFromNode(frame))
co.name='Type=' +(type||'None')
co.description='Design Release Notes change item. Duplicate instances in a log entry; edit Change name and Description without detaching.'
co.x=0
co.y=index*120*sc
variants.set(type,co)
names.push(name)
descriptions.push(description)
}
const set=owned(figma.combineAsVariants([...variants.values()],masters))
set.name = 'Design Release Notes / Change Item'
set.description='New, Feature, Updated, Fixed and Removed; None omits the badge.'
const nk=set.addComponentProperty('Change name','TEXT','Change name')
const dk=set.addComponentProperty('Description','TEXT','Description')
const sn=set.addComponentProperty('Show name','BOOLEAN',true)
const sd=set.addComponentProperty('Show description','BOOLEAN',true)
names.forEach(zQ=>{zQ.componentPropertyReferences={characters:nk,visible:sn}})
descriptions.forEach(zQ=>{zQ.componentPropertyReferences={characters:dk,visible:sd}})
return{variants,nk,dk,sn,sd}
}finally{
const zK=figma.currentPage.selection
const rr=sb.filter(zQ=>!zQ.removed)
if(zK.length!==rr.length||zK.some((zQ,index)=>zQ.id!==rr[index]?.id)){
figma.currentPage.selection=rr
}
}
}
let ih=0
function fn20(zQ:TextNode,url:S):void{
let value=url.trim();const hit=value.match(/[?&]node-id=([^&#]+)/);if(hit&&/^https:\/\/(www\.)?figma\.com\//i.test(value)){let id='';try{id=decodeURIComponent(hit[1]).replace(/-/g,':')}catch{}if(figma.root.children.some(p=>p.id===id))value=value.replace(/([?&])node-id=[^&#]+/,'$1page-id='+encodeURIComponent(id))}
const target={type:'URL' as const,value};
let linked=false;
try{zQ.setRangeHyperlink(0,zQ.characters.length,target);linked=true}catch{
try{zQ.hyperlink=target;linked=true}catch(error){zQ.setPluginData('link-error',String(error).slice(0,500))}
}
if(linked){zQ.textDecoration='UNDERLINE';return}
ih++;zQ.setPluginData('original-link-url',url);zQ.textDecoration='NONE';
}
function externalLink(parent:FrameNode,name:S,url:S,maxWidth:Num,sc:Num,dark:Bool,kind?:S):void{
const color=dark ? '#8ACFFF':'#005889'
const iconSize=(kind?22:16)*sc
const gap=6*sc
const link=layout('Link',maxWidth,gap,true)
parent.appendChild(link)
link.counterAxisAlignItems='CENTER'
const paths:Record<S,S>={"image":"M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M3 17l5-5 4 4 4-5 5 6 M9 8h.01","spec": "M6 3h9l3 3v15H6z M9 10h6m-6 4h6", "prototype": "M8 4l13 8-13 8z", "figma": "M12 12a3 3 0 1 1 3 3 3 3 0 0 1-3-3z M12 9H9a3 3 0 1 1 0-6h6a3 3 0 1 1 0 6h-3v9a3 3 0 1 1-3-3h3m0-6H9a3 3 0 1 0 0 6", "library": "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z", "notion": "M4 4h16v16H4z M8 16V8l8 8V8", "handoff": "M8 7l-5 5 5 5m8-10l5 5-5 5m-2-13l-4 16", "release": "M4 12a8 8 0 1 0 2-5M4 4v5h5m3-2v5l4 2", "external": "M10 7l3.5-3.5a4.95 4.95 0 0 1 7 7L17 14M14 17l-3.5 3.5a4.95 4.95 0 0 1-7-7L7 10M9 15l6-6"}
const emoji:Record<S,S>={spec:'📄',folder:'🗂️',video:'🎬',car:'🕒',star:'⭐',external:'🔗'}
const glyph=kind?emoji[kind]:undefined
if(kind==='image'){
const image=owned(figma.createRectangle())
image.name='Image resource icon'
image.resize(iconSize,iconSize)
image.fills=[{type:'IMAGE',scaleMode:'FIT',imageHash:figma.createImage(figma.base64Decode('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')).hash}]
link.appendChild(image)
}
else if(glyph)label(link,glyph,iconSize,iconSize,rgb(color),'regular',true,1)
else {
const icon=owned(figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${kind==='figma'?`<g stroke="none"><path fill="#F24E1E" d="M8 0h4v8H8a4 4 0 0 1 0-8Z"/><path fill="#FF7262" d="M12 0h4a4 4 0 0 1 0 8h-4Z"/><path fill="#A259FF" d="M8 8h4v8H8a4 4 0 0 1 0-8Z"/><circle fill="#1ABCFE" cx="16" cy="12" r="4"/><path fill="#0ACF83" d="M8 16h4v4a4 4 0 1 1-4-4Z"/></g>`:`<path d="${paths[kind||'external']||paths.external}"/>`}</svg>`))
icon.name='Link icon'
for(const layer of icon.findAll())owned(layer)
link.appendChild(icon)
}
const textWidth=Math.max(1,maxWidth-iconSize-gap)
const caption=label(link,name,textWidth,16*sc,rgb(color),'medium',true)
if(caption.width>textWidth){
caption.textAutoResize='HEIGHT'
caption.resize(textWidth,caption.height)
}
fn20(caption,url)
link.layoutSizingHorizontal='HUG'
}
function fn21(zR:FrameNode,library:CL,group:Group,sc:Num,dark:Bool,mu:RGB):void{
const master=library.variants.get(group.type)||library.variants.get('')!
const ix=owned(master.createInstance())
ix.name = 'Change Item / ' + (group.title || group.type || 'Description')
const items=group.items.filter(item=>item.text.trim())
const lines=items.map(item=>item.text)
ix.setProperties({
[library.nk]:group.title,
[library.dk]:lines.join('\n'),
[library.sn]:Boolean(group.title.trim()),
[library.sd]:false
})
const section=layout(ix.name,zR.width,4*sc)
zR.appendChild(section)
section.layoutSizingHorizontal='FILL'
section.appendChild(ix)
ix.layoutSizingHorizontal='FILL'
ix.layoutSizingVertical='HUG'
if(!items.length)return
const rows=layout('Change descriptions and links',zR.width,6*sc)
section.appendChild(rows)
rows.layoutSizingHorizontal='FILL'
for(const item of items){
const row=layout('Change description',zR.width,8*sc,true)
rows.appendChild(row)
row.layoutSizingHorizontal='FILL'
row.counterAxisAlignItems='MIN'
const marker=layout('Bullet',8*sc,0)
row.appendChild(marker)
marker.resize(8*sc,24*sc)
marker.layoutSizingHorizontal=marker.layoutSizingVertical='FIXED'
marker.primaryAxisAlignItems=marker.counterAxisAlignItems='CENTER'
const dot=owned(figma.createEllipse())
dot.name='Bullet dot'
dot.resize(4*sc,4*sc)
dot.fills=[solid(mu)]
marker.appendChild(dot)
const body=label(row,item.text,Math.max(1,zR.width-16*sc-(item.url?72*sc:0)),16*sc,mu)
body.layoutSizingHorizontal='FILL'
if(item.url){
externalLink(row,'Link',item.url,72*sc,sc,dark)
}
}
}
async function fn22(document:Doc,width:Num):Promise<FrameNode>{
await fn18()
const sc=width/640
const dark=document.theme==='dark'
const bg=rgb(dark ? '#202126':'#FFFFFF')
const fg=rgb(dark ? '#F3F4F7':'#24272A')
const mu=rgb(dark ? '#B0B6C4':'#4A566A')
const border=rgb(dark ? '#3B3E49':'#EDF0F5')
const padding=24*sc
const inside=width - padding*2
const content=layout('Design Release Notes content',width,0)
content.visible=false
content.fills=[solid(bg)]
content.cornerRadius=12*sc
content.topLeftRadius=content.topRightRadius=0
content.clipsContent=true
const visibleEntries=fn7(document)
const projectLinks=(document.projectResources||[]).filter(row=>validProjectUrl(row.url))
if(!visibleEntries.length&&!projectLinks.length)return content
try{
const changeComponents=fn19(content,inside - 48*sc,sc,dark,fg,mu)
const logs=layout('Changelog',width,20*sc)
logs.paddingLeft=logs.paddingRight=padding
logs.paddingTop=32*sc
if (dark) {
logs.strokes = [solid(rgb('#49515E'))]
logs.strokeAlign = 'INSIDE'
logs.strokeTopWeight = sc
logs.strokeRightWeight = logs.strokeBottomWeight = logs.strokeLeftWeight = 0
}
logs.paddingBottom=24*sc
content.appendChild(logs)
logs.layoutSizingHorizontal='FILL'
const changelogHeading=layout('Changelog hd',inside,8*sc,true)
logs.appendChild(changelogHeading)
changelogHeading.layoutSizingHorizontal='FILL'
changelogHeading.counterAxisAlignItems='CENTER'
if(projectLinks.length){
const section=layout('Project resources',inside,16*sc)
logs.insertChild(0,section)
section.layoutSizingHorizontal='FILL'
label(section,document.resourceLocale==='en'?'PROJECT RESOURCES':'專案資源',inside,18*sc,fg,'semibold')
const list=layout('Project resource links',inside,8*sc,true)
section.appendChild(list)
list.layoutSizingHorizontal='FILL'
list.layoutWrap='WRAP'
list.counterAxisSpacing=8*sc
for(const resource of projectLinks){
const chip=layout('Project resource',inside,0,true)
list.appendChild(chip)
chip.paddingLeft=chip.paddingRight=16*sc
chip.paddingTop=chip.paddingBottom=10*sc
chip.cornerRadius=8*sc
chip.fills=[solid(rgb(dark?'#303A48':'#EDF3F9'))]
chip.strokes=[solid(rgb(dark?'#525F70':'#BACAD8'))]
chip.strokeWeight=sc
externalLink(chip,resource.name||resource.url,resource.url,inside-32*sc,sc,dark,resource.type)
chip.layoutSizingHorizontal='HUG'
}
}
if(!visibleEntries.length){changelogHeading.remove();return content}
if(projectLinks.length)changelogHeading.paddingTop=8*sc
label(changelogHeading,document.resourceLocale==='en'?'CHANGELOG':'版本紀錄',inside,18*sc,fg,'semibold').layoutSizingHorizontal='FILL'
const history=layout('Version cards',inside,16*sc)
logs.appendChild(history)
history.layoutSizingHorizontal='FILL'
const cardFill=rgb(dark ? '#25272C':'#FAFBFC')
for(let index=0;index < visibleEntries.length;index +=1){
const entry=visibleEntries[index]
const groups=(entry.groups ??[]).map((group)=>({...group,type:(String(group.type)==='Bug fix' ? 'Fixed':group.type)as Group['type']})).filter((group)=>group.title.trim()||group.items.some((item)=>ct5(item,'條列').text.trim()))
const version=document.showVersions ? fn13(entry.version):''
const cardInside=inside - 48*sc
const review=entry.status==='In Review'
const card = layout(`Version ${index + 1}: ${entry.title || 'Untitled'}`, inside, 18 * sc)
card.paddingLeft=card.paddingRight=review?0:24*sc
card.paddingTop=review?0:24*sc
card.paddingBottom=24*sc
card.fills=[solid(cardFill)]
card.strokes=[solid(review&&!dark?rgb('#F1DFA9'):border)]
card.strokeWeight=sc
card.strokeAlign='INSIDE'
card.cornerRadius=12*sc
history.appendChild(card)
card.layoutSizingHorizontal='FILL'
const top=layout('Version header',review?inside:cardInside,12*sc,true)
if(review){
top.fills=[solid(rgb(dark?'#302E2D':'#F4E6BD'))]
top.paddingLeft=top.paddingRight=24*sc
top.paddingTop=top.paddingBottom=16*sc
card.clipsContent=true
}
card.appendChild(top)
top.layoutSizingHorizontal='FILL'
top.counterAxisAlignItems='CENTER'
const lead=layout('Version and status',cardInside,(review?14:8)*sc,true)
top.appendChild(lead)
lead.layoutSizingHorizontal='FILL'
lead.counterAxisAlignItems='CENTER'
const hasTitle=Boolean(entry.title.trim())
const hasDescription=Boolean(entry.description.trim())
const versionColor = rgb(dark ? '#B4BECC' : '#495569')
if(review){
const pill=layout('In Review',90*sc,0,true)
lead.appendChild(pill)
pill.layoutSizingHorizontal='HUG'
pill.paddingLeft=pill.paddingRight=12*sc
pill.paddingTop=pill.paddingBottom=4*sc
pill.cornerRadius=999
if(!dark)pill.fills=[solid(rgb('#FFF8E4'))]
pill.strokes=[solid(rgb(dark?'#B5A697':'#BF965E'))]
pill.strokeWeight=1.5*sc
pill.strokeAlign='INSIDE'
label(pill,entry.status,cardInside-24*sc,16*sc,rgb(dark?'#FFF1E3':'#80541F'),'bold',true,1.4)
}
label(lead,version||'Untitled',Math.max(60,cardInside - 108*sc),20*sc,versionColor,'medium',true)
if(!review&&entry.status&&entry.status!=='Released'){
const cs=fn12(entry.status,dark)
badge(lead,entry.status,sc,cs.bg,cs.fg)
}
const attribution=[document.showEntryDates ? fn16(entry.updated):'',entry.author.trim()&&entry.author.trim()!==document.designer.trim()? entry.author.trim():''].filter(Boolean).join('｜')
if(attribution){
const metadata=label(top,attribution,Math.max(80,cardInside - 100*sc),16*sc,mu,'regular',true)
metadata.name='Date and author'
metadata.textAlignHorizontal='RIGHT'
}
if(hasTitle||hasDescription||groups.length){
const headerContent=layout('Version header and content',cardInside,review?40:24)
card.appendChild(headerContent)
headerContent.layoutSizingHorizontal='FILL'
headerContent.appendChild(top)
top.layoutSizingHorizontal='FILL'
const body=layout('Version content',cardInside,54)
headerContent.appendChild(body)
body.layoutSizingHorizontal='FILL'
if(review)body.paddingLeft=body.paddingRight=24*sc
if(hasTitle||hasDescription){
const introduction=layout('Version introduction',cardInside,(review?8:4)*sc)
body.appendChild(introduction)
introduction.layoutSizingHorizontal='FILL'
if(hasTitle)label(introduction,entry.title,cardInside,20*sc,fg,'semibold')
if(hasDescription)label(introduction,entry.description,cardInside,16*sc,fg)
}
if(groups.length){
const changes=layout('Change items',cardInside,18*sc)
body.appendChild(changes)
changes.layoutSizingHorizontal='FILL'
for(const group of groups)fn21(changes,changeComponents,group,sc,dark,mu)
}
}
if(entry.link||entry.attachments.length){
const resourceSection=layout('Resource section',cardInside,0)
resourceSection.paddingTop=10*sc
card.appendChild(resourceSection)
resourceSection.layoutSizingHorizontal='FILL'
if(review)resourceSection.paddingLeft=resourceSection.paddingRight=24*sc
const resources=layout('Related resources',cardInside,6*sc)
resources.paddingTop=20*sc
resources.strokes=[solid(rgb(dark?'#3A3D46':'#E3E7EE'))]
resources.strokeAlign='INSIDE'
resources.strokeTopWeight=sc
resources.strokeRightWeight=resources.strokeBottomWeight=resources.strokeLeftWeight=0
resourceSection.appendChild(resources)
resources.layoutSizingHorizontal='FILL'
const english=document.resourceLocale==='en'
label(resources,english ? 'Related resources':'相關資源',cardInside,14*sc,mu,'medium')
const links=layout('Resource links',cardInside,16*sc,true)
links.layoutWrap='WRAP'
links.counterAxisSpacing=8*sc
links.counterAxisAlignContent='AUTO'
resources.appendChild(links)
links.layoutSizingHorizontal='FILL'
const resourceItems=entry.resources ??[...(entry.link ?[entry.link]:[]),...entry.attachments].map(url=>({url,name:entry.resourceNames?.[url]||''}))
for(const resource of resourceItems){
const url=resource.url
const name=resource.name.trim()
externalLink(links,name||'Link',url,cardInside,sc,dark)
}
}
if(entry.assets?.length){
const attachments=layout('Attachments',cardInside,8*sc)
card.appendChild(attachments)
attachments.layoutSizingHorizontal='FILL'
if(review)attachments.paddingLeft=attachments.paddingRight=24*sc
label(attachments,'Uploaded attachments',cardInside,12*sc,fg,'medium')
const images=entry.assets.filter((asset)=>asset.kind==='image')
if(images.length){
const grid=layout('Attachment image grid',cardInside,8*sc,true)
grid.layoutWrap='WRAP'
grid.counterAxisSpacing=8*sc
grid.counterAxisAlignContent='AUTO'
attachments.appendChild(grid)
grid.layoutSizingHorizontal='FILL'
for(const asset of images){
const thumbnail=owned(figma.createRectangle())
thumbnail.name = `Attachment image: ${asset.name}`
thumbnail.resize(72*sc,88*sc)
thumbnail.cornerRadius=4*sc
thumbnail.fills=[{type:'IMAGE',imageHash:asset.hash,scaleMode:'FIT'}]
grid.appendChild(thumbnail)
thumbnail.layoutSizingHorizontal=thumbnail.layoutSizingVertical='FIXED'
}
}
for(const asset of entry.assets.filter((item)=>item.kind==='file')){
const tile = layout(`Attachment file: ${asset.name}`, cardInside, 2 * sc)
tile.paddingLeft=tile.paddingRight=8*sc
tile.paddingTop=tile.paddingBottom=6*sc
tile.fills=[solid(border)]
tile.cornerRadius=4*sc
attachments.appendChild(tile)
tile.layoutSizingHorizontal='FILL'
label(tile,asset.name,cardInside - 16*sc,12*sc,fg,'medium')
label(tile, `${asset.mime} · ${Math.ceil(asset.size / 1024)} KiB · Preview in plugin`, cardInside - 16 * sc, 11 * sc, mu)
}
}
}
return content
}catch(error){
content.remove()
throw error
}
}
function dm(code:S):S{return UI_BUNDLE.messages[code]}const DP=new Set<S>();function db(e:En|undefined,head:S|undefined,count:Num,unlocked:S[],now=Date.now()):S{if(count<2)return 'last';if(!e)return 'missing';if(!SS.includes(e.status))return '';if(!e.rid||e.rid!==head)return 'latest';if(!e.born||now<e.born||now-e.born>=86400000)return 'expired';return unlocked.includes(e.rid)?'':'locked'}
function guardHistory(old:Doc,next:Doc,unlock:S[],now=Date.now(),target=''):void{const incoming=new Map(next.entries.map(e=>[e.rid,e]));for(const e of old.entries){if(!SS.includes(e.status))continue;const found=incoming.get(e.rid);if(found){if(!SS.includes(found.status))throw new VE('已發布版本無法退回 Draft 或 In Review。');continue}if(e.rid!==old.latestId)throw new VE(dm('latest'));if(e.rid&&DP.has(target+':'+e.rid))continue;const why=db(e,old.latestId,next.entries.length+1,unlock,now);if(why)throw new VE(dm(why))}}
function solidOf(n:SceneNode|undefined):RGB|null{if(!n||!('fills'in n)||!Array.isArray(n.fills))return null;const p=(n.fills as readonly Paint[]).find(p=>p.type==='SOLID'&&p.visible!==false);return p&&p.type==='SOLID'?p.color:null}
function fitHero(c:FrameNode,company:TextNode):void{const q=c.width/1920,hero=c.children.find(n=>n.type==='FRAME'&&n.name==='Cover / Text') as FrameNode|undefined;if(!hero||hero.layoutMode!=='VERTICAL'||!hero.children.some(n=>n.name==='Cover / Title group'))return;const on=company.visible;hero.y=(on?82:0)*q;hero.resize(1120*q,(on?800:882)*q)}
function fitMeta(c:FrameNode):void{const meta=c.children.find(n=>n.type==='FRAME'&&n.name==='Cover / Metadata') as FrameNode|undefined,foot=c.children.find(n=>n.type==='RECTANGLE'&&n.name==='Cover / Footer background') as RectangleNode|undefined;if(!meta||!foot||!foot.visible)return;meta.y=foot.y+(foot.height-meta.height)/2}
function coverLayoutV2(c:FrameNode,fields:TextNode[],status:SceneNode|undefined):()=>void{
const ns='design_release_notes',key='cover-layout',old=c.getSharedPluginData(ns,key);if(old==='10')return()=>{};
const q=c.width/1920,created:SceneNode[]=[],oldClip=c.clipsContent;
const moved=fields.map(n=>({n,parent:n.parent as ChildrenMixin&BaseNode,index:(n.parent as ChildrenMixin).children.indexOf(n),transform:n.relativeTransform,w:n.width,h:n.height,font:n.fontName,size:n.fontSize,line:n.lineHeight,auto:n.textAutoResize,trunc:n.textTruncation,max:n.maxLines,fills:n.fills,align:n.textAlignVertical}));
const st=status?{n:status,parent:status.parent as ChildrenMixin&BaseNode,index:(status.parent as ChildrenMixin).children.indexOf(status),transform:status.relativeTransform,w:status.width,h:status.height}:null;
const restored:Array<()=>void>=[];
function row(name:S):FrameNode{let n=c.children.find(n=>n.type==='FRAME'&&n.name===name) as FrameNode|undefined;if(n){const a={x:n.x,y:n.y,w:n.width,h:n.height,spacing:n.itemSpacing,clips:n.clipsContent,mode:n.layoutMode};const f=n;restored.push(()=>{f.resize(a.w,a.h);f.x=a.x;f.y=a.y;f.itemSpacing=a.spacing;f.clipsContent=a.clips;f.layoutMode=a.mode})}else{n=figma.createFrame();n.name=name;n.fills=[];c.appendChild(n);created.push(n)}return n}
const hero=row('Cover / Text');hero.layoutMode='VERTICAL';hero.primaryAxisSizingMode=hero.counterAxisSizingMode='FIXED';hero.primaryAxisAlignItems=hero.counterAxisAlignItems='MIN';hero.itemSpacing=0;hero.paddingLeft=hero.paddingRight=hero.paddingTop=hero.paddingBottom=0;hero.clipsContent=false;hero.resize(960*q,800*q);hero.x=144*q;hero.y=82*q;
const [company,category,title,designer]=fields;
let body=hero.children.find(n=>n.type==='FRAME'&&n.name==='Cover / Title group') as FrameNode|undefined;if(!body){body=figma.createFrame();body.name='Cover / Title group';body.fills=[];created.push(body)}
body.layoutMode='VERTICAL';body.primaryAxisSizingMode=body.counterAxisSizingMode='FIXED';body.primaryAxisAlignItems='CENTER';body.counterAxisAlignItems='MIN';body.itemSpacing=12*q;body.paddingLeft=body.paddingRight=body.paddingTop=body.paddingBottom=0;body.clipsContent=false;
hero.appendChild(company);hero.appendChild(body);body.appendChild(category);body.appendChild(title);
for(const[t,size,line]of [[company,68,102],[category,68,102],[title,102,135]] as Array<[TextNode,Num,Num]>){t.fontName=t===title?zA.semibold:t===company?zA.bold:zA.medium;t.fontSize=size*q;t.lineHeight={unit:'PIXELS',value:line*q};t.textTruncation='ENDING';t.maxLines=t===title?3:1;t.resize(960*q,line*q);t.textAutoResize='HEIGHT'}
company.resize(960*q,102*q);company.textAutoResize='NONE';company.textAlignVertical='TOP';company.layoutSizingHorizontal='FILL';company.layoutSizingVertical='FIXED';
body.layoutSizingHorizontal='FILL';body.layoutSizingVertical='FILL';category.layoutSizingHorizontal='FILL';title.layoutSizingHorizontal='FILL';
for(const t of [category,title]){t.textAutoResize='HEIGHT';t.textTruncation='ENDING';t.maxLines=t===title?3:1}company.textTruncation='ENDING';company.maxLines=1;category.fills=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:0.6}];
let footer=c.children.find(n=>n.type==='RECTANGLE'&&n.name==='Cover / Footer background') as RectangleNode|undefined;
if(footer){const f=footer,a={x:f.x,y:f.y,w:f.width,h:f.height,fills:f.fills};restored.push(()=>{f.resize(a.w,a.h);f.x=a.x;f.y=a.y;f.fills=a.fills as readonly Paint[]})}else{footer=figma.createRectangle();footer.name='Cover / Footer background';c.appendChild(footer);created.push(footer)}
const bgc=solidOf(c.children.find(n=>n.name==='BG'))||solidOf(c),fc:RGB=bgc?{r:bgc.r*.55,g:bgc.g*.55,b:bgc.b*.55}:rgb('#1B2129');footer.resize(c.width,198*q);footer.fills=[{type:'SOLID',color:fc}];footer.x=0;footer.y=882*q;
const meta=row('Cover / Metadata');meta.layoutMode='HORIZONTAL';meta.primaryAxisSizingMode=meta.counterAxisSizingMode='FIXED';meta.counterAxisAlignItems='CENTER';meta.itemSpacing=32*q;meta.clipsContent=false;meta.resize(1632*q,127*q);meta.x=144*q;meta.y=(882+(198-127)/2)*q;
meta.appendChild(designer);designer.fontName=zA.bold;designer.fontSize=67*q;designer.lineHeight={unit:'PIXELS',value:101*q};designer.textAutoResize='HEIGHT';designer.resize(900*q,101*q);designer.textTruncation='ENDING';designer.maxLines=1;designer.fontName=zA.bold;designer.fills=[solid(rgb('#FFFFFF'))];
let spacer=meta.children.find(n=>n.name==='Cover / Status alignment') as FrameNode|undefined;if(!spacer){spacer=figma.createFrame();spacer.name='Cover / Status alignment';spacer.fills=[];meta.appendChild(spacer);created.push(spacer)}else meta.appendChild(spacer);spacer.resize(1,1);spacer.layoutGrow=1;
if(status){meta.appendChild(status);if('rescale'in status)(status as FrameNode|InstanceNode).rescale(127*q/status.height);if('layoutGrow'in status)status.layoutGrow=0}
for(const n of [...c.children])if(n.name==='Cover / Divider')n.remove();
for(const n of c.children){if((n.name==='Cover / Text'&&n!==hero)||(n.name==='Cover / Metadata'&&n!==meta)||(n.name==='Cover / Footer background'&&n!==footer)){const v=n.visible;restored.push(()=>{n.visible=v});n.visible=false}}c.appendChild(hero);c.appendChild(footer);c.appendChild(meta);c.clipsContent=true;c.setSharedPluginData(ns,key,'10');
return()=>{for(const x of moved){x.parent.insertChild(x.index,x.n);x.n.fontName=x.font as FontName;x.n.fontSize=x.size as Num;x.n.lineHeight=x.line as LineHeight;x.n.textAutoResize=x.auto;x.n.textTruncation=x.trunc;x.n.maxLines=x.max;x.n.fills=x.fills as readonly Paint[];x.n.textAlignVertical=x.align;x.n.resize(x.w,x.h);x.n.relativeTransform=x.transform}if(st){st.parent.insertChild(st.index,st.n);if('rescale'in st.n)(st.n as FrameNode|InstanceNode).rescale(st.h/st.n.height);st.n.relativeTransform=st.transform}restored.reverse().forEach(f=>f());created.reverse().forEach(n=>{if(!n.removed)n.remove()});c.clipsContent=oldClip;c.setSharedPluginData(ns,key,old)}
}
const COVER='drn-cover',CF='drn-cover-field';
function isCover(n:SceneNode):n is FrameNode{return n.type==='FRAME'&&(n.getPluginData(COVER)==='1'||n.name==='Cover')}
type CoverPlan={node:FrameNode;apply:()=>void;attach:(root:FrameNode)=>void;undo:()=>void;finish:()=>void};
async function prepareCover(doc:Doc,root:FrameNode|null,width:Num):Promise<CoverPlan>{
const entries=fn15(doc.entries),active=entries.find(e=>e.status!=='Deprecated'),state=active?.status==='Released'?'Delivery':'WIP';
const released=entries.find(e=>e.status==='Released'&&e.version.trim());
const v=doc.showCoverVersion!==false&&released?fn13(released.version):'';
const nested:FrameNode[]=[];if(root)for(const n of root.children)if(n.type==='FRAME')for(const child of n.children)if(isCover(child))nested.push(child);
let cover:FrameNode|undefined=root?.children.find(isCover)||nested[0];const fresh=!cover,extras:SceneNode[]=[];
const unit=width/1280,targetHeight=width*9/16,footerHeight=132.767*unit,heroHeight=targetHeight-footerHeight;
function ct(p:FrameNode,name:S,value:S,x:Num,y:Num,w:Num,size:Num,color:S,font:FontName=zA.semibold):TextNode{const t=figma.createText();t.name=name;t.fontName=font;t.fontSize=size;t.lineHeight={unit:'PERCENT',value:132};t.characters=value;t.fills=[solid(rgb(color))];p.appendChild(t);t.resize(w,Math.ceil(size*1.32));t.textAutoResize='HEIGHT';t.x=x;t.y=y;return t}
try{
if(!cover){const templates:FrameNode[]=[];for(const n of figma.currentPage.children)if(n.type==='FRAME'){if(n.getPluginData(COVER)==='1'||n.name==='Cover')templates.push(n);else for(const child of n.children)if(isCover(child))templates.push(child)}const template=templates.find(n=>n.getSharedPluginData('design_release_notes','cover-template')==='1')||templates.find(n=>n.findAllWithCriteria({types:['INSTANCE']}).some(i=>i.name==='Cover_Status'&&Object.values(i.componentProperties).some(p=>p.value===state)))||templates[0];if(template){cover=template.clone();cover.setSharedPluginData('design_release_notes','cover-template','');cover.visible=false;cover.rescale(width/template.width);const oldHeight=cover.height,delta=targetHeight-oldHeight;for(const child of cover.children){if(child.y>=oldHeight*.75)child.y+=delta;else if(child.type==='RECTANGLE'&&child.width>=width*.8&&(Math.abs(child.height-oldHeight)<2||Math.abs(child.height-520.85*unit)<2))child.resize(child.width,child.height+delta)}cover.resize(width,targetHeight);for(const n of [cover,...cover.findAllWithCriteria({types:['RECTANGLE','ELLIPSE','VECTOR','FRAME','POLYGON','STAR']})]){if(Array.isArray(n.fills)&&n.fills.some(p=>p.type==='IMAGE'))n.fills=n.fills.filter(p=>p.type!=='IMAGE')}}else{cover=figma.createFrame();cover.name='Cover';cover.resize(width,targetHeight);cover.clipsContent=true;cover.fills=[solid(rgb('#303B4B'))];try{const vec=figma.createVector();vec.name='Vector';cover.appendChild(vec);vec.vectorPaths=[{windingRule:'NONZERO',data:'M 782.6711784905609 198.00896570627202 L 626.6149622077559 198.00896570627202 L 626.6149622077559 0 L 0 0 L 0 469.95302898098356 L 318.4773117591595 469.95302898098356 L 472.0655636398202 736 L 782.6711784905609 736 L 938 467.0174692900479 L 782.6711784905609 198.00896570627202 Z'}];vec.fills=[{type:'GRADIENT_LINEAR',gradientStops:[{position:0,color:{r:0.3490196764469147,g:0.40000006556510925,b:0.46666672825813293,a:1}},{position:1,color:{r:0.7367187738418579,g:0.7912240028381348,b:0.862500011920929,a:0.5}}],gradientTransform:[[1.0485734939575195,0.2730352282524109,-0.26903611421585083],[-0.2730352282524109,1.0485734939575195,-0.5736367106437683]]}];vec.opacity=0.3;if(width!==1920)vec.rescale(width/1920);vec.x=1329*width/1920;vec.y=-178*width/1920}catch{}const footer=figma.createRectangle();footer.name='Cover / Footer background';footer.resize(width,footerHeight);footer.fills=[solid(rgb('#1B2129'))];cover.appendChild(footer);footer.x=0;footer.y=heroHeight;ct(cover,'Cover / Company','',143*unit,22*unit,1084*unit,45*unit,'#FFFFFF',zA.bold).setPluginData(CF,'company');const categoryText=ct(cover,'Cover / Category','',143*unit,130*unit,1084*unit,45*unit,'#FFFFFF',zA.regular);categoryText.fills=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:0.6}];categoryText.setPluginData(CF,'category');const titleText=ct(cover,'Cover / Title',doc.title,143*unit,177*unit,1084*unit,68*unit,'#FFFFFF');titleText.textTruncation='ENDING';titleText.maxLines=3;titleText.setPluginData(CF,'title');ct(cover,'Cover / Designer','',143*unit,heroHeight+(footerHeight-59.4*unit)/2,650*unit,45*unit,'#FFFFFF',zA.bold).setPluginData(CF,'designer');const pill=layout('Cover status',298*unit,8*unit,true);cover.appendChild(pill);pill.resize(298*unit,84.4*unit);pill.layoutSizingHorizontal=pill.layoutSizingVertical='FIXED';pill.primaryAxisAlignItems=pill.counterAxisAlignItems='CENTER';pill.cornerRadius=999;pet(pill);ct(pill,'Cover / Status','WIP',0,0,250*unit,34*unit,'#17202A',zA.bold).setPluginData(CF,'status');pill.x=width-393.3*unit;pill.y=heroHeight+(footerHeight-84.4*unit)/2;function pet(p:FrameNode){p.setPluginData(CF,'status-bg')}cover.visible=false}}
const c=cover!;if(c.locked)throw new VE('請先解鎖封面，再更新版本紀錄。');
const texts=c.findAllWithCriteria({types:['TEXT']}),tag=(r:S)=>texts.find(t=>t.getPluginData(CF)===r),position=(t:SceneNode)=>t.absoluteTransform[1][2]-c.absoluteTransform[1][2];
const plain=texts.filter(t=>!['WIP','DELIVERY','Delivery'].includes(t.characters.trim()));
const title=tag('title')||plain.slice().sort((a,b)=>Number(b.fontSize)-Number(a.fontSize))[0];
const designer=tag('designer')||plain.find(t=>t!==title&&position(t)>c.height*.75);
const company=tag('company')||plain.filter(t=>t!==title&&t!==designer&&position(t)<c.height*.2).sort((a,b)=>position(a)-position(b))[0];
const unusedCategory=tag('category')||texts.find(t=>t.name==='Cover / Category');
const category=unusedCategory||(!title?.parent || title.parent.name!=='Cover / Title group'?plain.find(t=>t!==title&&t!==designer&&t!==company&&t.getPluginData(CF)!=='version'&&position(t)<c.height*.5):undefined);
if(!title||!designer||!company)throw new VE('封面文字欄位不完整，請保留專案名稱、設計師與公司欄位。');
const status=c.findAllWithCriteria({types:['INSTANCE']}).find(i=>i.name==='Cover_Status'&&i.componentProperties.State?.type==='VARIANT');
const statusText=tag('status')||texts.find(t=>['WIP','DELIVERY','Delivery'].includes(t.characters.trim()));if(!status&&!statusText)throw new VE('封面的 WIP／DELIVERY 狀態元件已遺失。');
const roles:Array<[TextNode,S,S]>=[[title,'title',v?doc.title.replace(/\r?\n[ \t]*v?\d+(?:\.\d+)+[ \t]*$/i,''):doc.title],[designer,'designer',doc.designer],[company,'company',[doc.company,doc.category].map(x=>x?.trim()).filter(Boolean).join(' ｜ ')]];if(category)roles.push([category,'category','']);if(statusText&&!status)roles.push([statusText,'status',state==='Delivery'?'✓ DELIVERY':'✎ WIP']);
const fonts:FontName[]=[];for(const[t]of roles){if(t.locked)throw new VE('請先解鎖封面文字，再更新。');const list=typeof t.fontName==='symbol'?t.getRangeAllFontNames(0,t.characters.length):[t.fontName];for(const f of list)if(!fonts.some(x=>JSON.stringify(x)===JSON.stringify(f)))fonts.push(f)}for(const f of [zA.medium,zA.semibold,zA.bold,zB.semibold,zB.bold])if(!fonts.some(x=>JSON.stringify(x)===JSON.stringify(f)))fonts.push(f);if(status)for(const t of status.findAllWithCriteria({types:['TEXT']}))for(const seg of t.getStyledTextSegments(['fontName']))if(!fonts.some(x=>JSON.stringify(x)===JSON.stringify(seg.fontName)))fonts.push(seg.fontName);try{await Promise.all(fonts.map(f=>figma.loadFontAsync(f)))}catch{throw new VE('無法載入封面字型，請確認字型可用後再更新。')}
const statusBg=c.findAllWithCriteria({types:['FRAME']}).find(n=>n.getPluginData(CF)==='status-bg'),oldBg=statusBg?.fills,oldCoverTag=c.getPluginData(COVER),oldOwner=c.getPluginData(OW);
const before=roles.map(([t])=>({t,text:t.characters,visible:t.visible,role:t.getPluginData(CF)})),oldState=status?.componentProperties.State.value,statusHeight=status?.height,oldParent=c.parent,oldIndex=oldParent&&'children'in oldParent?oldParent.children.indexOf(c):-1,oldTransform=c.relativeTransform,oldVisible=c.visible,oldName=c.name;
const oldTitleName=title.name,oldTrunc=title.textTruncation,oldMax=title.maxLines;
const titleGroup=title.parent?.type==='FRAME'&&title.parent.name==='Cover / Title group'?title.parent:null;
const oldTitleSpacing=titleGroup?.itemSpacing,oldPadding=titleGroup?.paddingBottom,oldCompanySize=company.fontSize;
const oldTitleStyles=title.getStyledTextSegments(['fontName','fontSize','lineHeight']);
let styledTitle=false;
const hero0=c.children.find(n=>n.type==='FRAME'&&n.name==='Cover / Text') as FrameNode|undefined,heroY=hero0?.y,heroW=hero0?.width,heroH=hero0?.height;
const meta0=c.children.find(n=>n.type==='FRAME'&&n.name==='Cover / Metadata') as FrameNode|undefined,metaY=meta0?.y;
let undoLayout:()=>void=()=>{};let moved=false,applied=false,host:FrameNode|null=null,hostLayout:FrameNode['layoutMode']|null=null;
return{node:c,finish(){if(unusedCategory&&!unusedCategory.removed)unusedCategory.remove()},apply(){applied=true;title.textTruncation='ENDING';title.maxLines=3;for(const[t,role,value]of roles){if(t.characters!==value)t.characters=value;t.visible=Boolean(value.trim());t.setPluginData(CF,role)}if(status&&oldState!==state)status.setProperties({State:state});if(statusBg)statusBg.fills=[solid(rgb(state==='Delivery'?'#0DD88E':'#C5CAD2'))];if(status&&(fresh||oldState!==state)){if(status.layoutMode!=='NONE'){status.primaryAxisSizingMode='AUTO';status.counterAxisSizingMode='AUTO';status.layoutSizingHorizontal=status.layoutSizingVertical='HUG'}status.rescale((statusHeight||127*c.width/1920)/status.height);status.clipsContent=false}if(category)undoLayout=coverLayoutV2(c,[company,category,title,designer],status||statusBg);
fitHero(c,company);
const body=title.parent,footer=designer.parent,q=c.width/1920;
if(body?.type==='FRAME'&&body.name==='Cover / Title group'&&footer?.type==='FRAME'&&footer.name==='Cover / Metadata'){
const prev=undoLayout,oldWidth=designer.width,oldFills=designer.fills;
const prior=tag('version'),parent=prior?.parent as (ChildrenMixin&BaseNode)|undefined,index=prior&&parent?parent.children.indexOf(prior):0;
const version=prior||ct(body,'Cover / Version','',0,0,960*q,88*q,'#E2E8F1');
const {characters,visible,fontName,fontSize,lineHeight,fills,textAutoResize,layoutSizingHorizontal,textTruncation,maxLines,width:versionWidth,height:versionHeight}=version;
undoLayout=()=>{if(prior&&parent){parent.insertChild(index,version);version.fontName=fontName as FontName;version.fontSize=fontSize as Num;version.lineHeight=lineHeight as LineHeight;version.fills=fills as readonly Paint[];version.characters=characters;version.visible=visible;version.resize(versionWidth,versionHeight);version.layoutSizingHorizontal=layoutSizingHorizontal;version.textAutoResize=textAutoResize;version.textTruncation=textTruncation;version.maxLines=maxLines}else version.remove();designer.resize(oldWidth,designer.height);designer.fills=oldFills;prev()};
if(prior&&version.parent!==body)body.appendChild(version);
version.fontName=zA.semibold;version.fontSize=92*q;version.lineHeight={unit:'PIXELS',value:120*q};
version.fills=[solid(rgb('#E2E8F1'))];version.characters=v;version.textAutoResize='HEIGHT';
version.setPluginData(CF,'version');
version.visible=Boolean(v);
version.layoutSizingHorizontal='FILL';
version.textTruncation='ENDING';version.maxLines=1;
body.itemSpacing=20*q;
body.paddingBottom=company.visible?32*q:0;
company.fontSize=60*q;
styledTitle=true;
title.fontName=/[⺀-鿿가-힯]/.test(title.characters)?zB.bold:zA.bold;
title.textTruncation='DISABLED';title.textAutoResize='HEIGHT';
title.fontSize=110*q;title.lineHeight={unit:'PIXELS',value:132*q};
if(title.height<=265*q){
version.fontSize=110*q;version.lineHeight={unit:'PIXELS',value:132*q};
}else{
title.fontSize=92*q;title.lineHeight={unit:'PIXELS',value:120*q};
}
designer.fills=[solid(rgb('#FFFFFF'))];
designer.resize(Math.max(1,footer.width-((status||statusBg)?.width||0)-footer.itemSpacing*2-8*q),designer.height);
}
fitMeta(c);
for(const n of [...c.children])if(n.name==='Cover / Divider')n.remove();title.name='Cover / Title';title.lineHeight={unit:'AUTO'};title.textAutoResize='HEIGHT';title.textTruncation='ENDING';title.maxLines=3;const mr=c.children.find(n=>n.name==='Cover / Metadata');if(mr?.type==='FRAME')mr.clipsContent=false;c.setPluginData(COVER,'1');c.setPluginData(OW,'');if(fresh)c.name='Cover';},attach(r){host=r;hostLayout=r.layoutMode;r.layoutMode='VERTICAL';r.itemSpacing=0;r.paddingLeft=r.paddingRight=r.paddingTop=r.paddingBottom=0;r.insertChild(0,c);moved=true;c.visible=fresh?true:oldVisible;if(fresh)c.layoutSizingHorizontal='FIXED'},undo(){if(fresh){if(!c.removed)c.remove();return}if(moved&&oldParent&&'insertChild'in oldParent&&!oldParent.removed){oldParent.insertChild(Math.max(0,oldIndex),c);c.relativeTransform=oldTransform}if(host&&hostLayout)host.layoutMode=hostLayout;if(applied){undoLayout();if(titleGroup&&oldTitleSpacing!==undefined){titleGroup.itemSpacing=oldTitleSpacing;titleGroup.paddingBottom=oldPadding||0}if(styledTitle)company.fontSize=oldCompanySize as Num;if(hero0&&!hero0.removed&&heroY!==undefined&&heroH!==undefined){hero0.y=heroY;hero0.resize(heroW??hero0.width,heroH)}if(meta0&&!meta0.removed&&metaY!==undefined)meta0.y=metaY;title.name=oldTitleName;title.textTruncation=oldTrunc;title.maxLines=oldMax;before.forEach(x=>{x.t.characters=x.text;x.t.visible=x.visible;x.t.setPluginData(CF,x.role)});if(styledTitle)for(const style of oldTitleStyles){title.setRangeFontName(style.start,style.end,style.fontName);title.setRangeFontSize(style.start,style.end,style.fontSize);title.setRangeLineHeight(style.start,style.end,style.lineHeight)}if(status&&typeof oldState==='string')status.setProperties({State:oldState})}if(statusBg&&oldBg)statusBg.fills=oldBg;c.setPluginData(COVER,oldCoverTag);c.setPluginData(OW,oldOwner);c.visible=oldVisible;c.name=oldName;extras.forEach(n=>{if(!n.removed)n.remove()})}};
}catch(error){extras.forEach(n=>{if(!n.removed)n.remove()});if(fresh&&cover&&!cover.removed)cover.remove();throw error}
}
async function save(msg:Extract<Msg,{type:'save'}>):Promise<void>{
if(ex)return
ex=true
let cp:CoverPlan|null=null
let zE:FrameNode | null=null
let zF:FrameNode | null=null
let zG:FrameNode | null=null
let zD=''
const zI:S[]=[]
const zC=new Map<string,string>()
let zP:SceneNode[]=[]
try{
const document=fn4(msg.document,true)
document.updated=today()
document.entries=fn15(document.entries)
let rt=msg.action==='update' ? fn9():null
if(msg.action==='update'){
if(!rt||rt.id!==msg.targetId||!fn8(rt))throw new VE('請選取要更新的 Design Release Notes 卡片，並載入它的資料。')
fn10(rt)
}
const old=rt?fn8(rt):null,now=Date.now(),prior=new Map((old?.entries||[]).map(e=>[e.rid,e])),added=document.entries.filter(e=>!prior.has(e.rid));for(const e of document.entries){const p=prior.get(e.rid);e.born=p?p.born:msg.action==='create'&&e.born?e.born:now}if(new Set(document.entries.map(e=>e.rid)).size!==document.entries.length)throw new VE('版本識別資料重複，請重新載入。');document.latestId=old?(added.length?(added.some(e=>e.rid===document.latestId)?document.latestId:added[0].rid):old.latestId):(document.latestId||document.entries[0].rid);if(old)guardHistory(old,document,Array.isArray(msg.unlockedIds)?msg.unlockedIds:[],now,rt?.id)
const width=1920
const source=msg.targetId&&fn1(document).length ? await figma.getNodeByIdAsync(msg.targetId):null
const files=new Map<string,string>()
for(const asset of fn1(document)){
const bytes=await ct4(asset,source?.type==='FRAME'&&source.getPluginData(RK)==='1' ? source:null)
if(asset.kind==='file')files.set(asset.id,figma.base64Encode(bytes))
}
const zH=JSON.stringify({schema:1,document})
ih=0
zE=await fn22(document,width)
cp=await prepareCover(document,rt,width)
if(rt){
if(rt.removed||fn9()?.id!==rt.id)throw new VE('選取的卡片已改變。請重新選取後再更新。')
fn10(rt)
zF=rt
zD=rt.getPluginData(DK)
for(const[id,bytes]of files){
zC.set(AK + id,rt.getPluginData(AK + id))
rt.setPluginData(AK + id,bytes)
}
const transform=rt.relativeTransform
const oldHeight=rt.height
zP=rt.children.filter((child)=>child.getPluginData(OW)==='1'&&child!==cp?.node)
const zJ=zP.length===rt.children.length
rt.appendChild(zE)
zE.x=zE.y=0
rt.resize(width,Math.max(oldHeight,zE.height))
rt.relativeTransform=transform
if(zJ&&rt.layoutMode==='NONE'){
rt.layoutMode='VERTICAL'
rt.itemSpacing=0
rt.paddingLeft=rt.paddingRight=rt.paddingTop=rt.paddingBottom=0
rt.resize(width,zE.height)
}
}else{
rt=figma.createFrame()
zG=rt
for(const[id,bytes]of files)rt.setPluginData(AK + id,bytes)
rt.fills=[]
rt.clipsContent=false
rt.layoutMode='VERTICAL'
rt.resize(width,zE.height)
rt.appendChild(zE)
zE.x=zE.y=0
rt.itemSpacing=0
rt.paddingLeft=rt.paddingRight=rt.paddingTop=rt.paddingBottom=0
}
cp.apply();cp.attach(rt)
zE.visible=zE.children.length>0
if(rt.layoutMode==='VERTICAL'){
rt.layoutSizingHorizontal='FIXED'
rt.layoutSizingVertical='HUG'
zE.layoutSizingHorizontal='FILL'
zE.layoutSizingVertical='HUG'
}
if(msg.action==='create'){
const center=figma.viewport.center
rt.x = center.x - rt.width / 2
rt.y = center.y - rt.height / 2
}
const projectName = document.title.replace(/\s*[\r\n]+\s*/g,' ').trim()
rt.name = projectName ? `Design Release Note｜${projectName}` : 'Design Release Note'
rt.setPluginData(RK,'1')
fn6(rt,zH,zI)
rt.setRelaunchData({[TI]:DN})
for(const child of zP)child.remove()
const zL=new Set(zI)
for(const key of rt.getPluginDataKeys()){
if(key.startsWith(HP)&&!zL.has(key)){
try { rt.setPluginData(key, '') } catch { /* Old unreferenced chunks can be cleaned on a later save. */ }
}
}
const zM=new Set(files.keys())
for(const key of rt.getPluginDataKeys()){
if(key.startsWith(AK)&&!zM.has(key.slice(AK.length))){
try { rt.setPluginData(key, '') } catch { /* Retry non-destructive stale-byte cleanup on the next save. */ }
}
}
figma.currentPage.selection=[rt]
if(msg.action==='create')figma.viewport.scrollAndZoomIntoView([rt])
figma.ui.postMessage({ type: 'saved', targetId: rt.id, document, message: (msg.action === 'create' ? '已建立版本紀錄。' : '已更新版本紀錄，已套用外觀設定。') + (ih ? ` ${ih} 個連結尚未建立；名稱與原網址已保留，請重新設定連結。` : '') })
cp.finish()
cp=null
zE=null
}catch(error){
cp?.undo()
if(zE&&!zE.removed)zE.remove()
if(zG&&!zG.removed)zG.remove()
if(zF&&!zF.removed){
zF.setPluginData(DK,zD)
for(const key of zI){
try { zF.setPluginData(key, '') } catch { /* Unreferenced chunks do not replace the saved history. */ }
}
for(const[key,value]of zC){
if(zF.getPluginData(key)!==value)zF.setPluginData(key,value)
}
}
const messageText=error instanceof Error ? error.message:String(error)
figma.ui.postMessage({type:'error',message:messageText})
}finally{
ex=false
fn11()
}
}
const UI_BUNDLE:{messages:Record<S,S>}={messages:{"last":"至少需保留一個版本。","missing":"版本資料已變更，請重新載入。","latest":"僅可刪除最近新增的已發布版本。","expired":"已超過可刪除期限。","locked":"請先解鎖後再刪除。","busy":"儲存中，請稍後再試。"}};
const UI_PATCHES:Array<[S,S]>=[["<div class=vmh><b>版本編號</b><div class=vmseg><button type=button data-vm=manual>手動</button><button type=button data-vm=auto>自動遞增</button></div><span class=vmradio>", "<div class=vmh><b>版本編號</b><span class=vmradio>"], ["<div id=vao hidden><div class=vr><label class=yf>版本格式<select id=versionFormat><option value=two>兩段式 · 1.2</option><option value=three selected>三段式 · 1.2.3</option></select></label><label class=yf>新增版本時預設<select id=defaultVersionBump>", "<div class=\"vr vmrow\"><label class=\"yf vml\">遞增方式<select id=vmsel onchange=\"var r=document.querySelector('[name=versionMode][value='+this.value+']');if(r&&!r.checked){r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}))}\"><option value=manual>手動</option><option value=auto selected>自動遞增</option></select></label><label class=\"yf vbl\">新增版本時預設<select id=defaultVersionBump>"], ["</select></label></div><p class=vpreview>", "</select></label></div><select id=versionFormat hidden><option value=two>兩段式 · 1.2</option><option value=three selected>三段式 · 1.2.3</option></select><div id=vao hidden><p class=vpreview>"], ["E(\"versionFormat\",e.versionFormat||\"three\")", "E(\"versionFormat\",\"three\")"], ["版本編號|Version numbering\\n", "版本編號|Version numbering\\n遞增方式|Increment mode\\n"], ["urlbox.hidden=!row.open;\n  }", "urlbox.hidden=false;\n  }"], ["line.append(name,attach,remove);const urlbox=D.createElement('div');urlbox.className='resource-edit-url';urlbox.hidden=!r.open;", "line.append(name,remove);const urlbox=D.createElement('div');urlbox.className='resource-edit-url';urlbox.hidden=false;"], ["x¦;padding:0 9px¦;line-height:1¦}</style>", "x¦;padding:0 9px¦;line-height:1¦}</style><style>\n§ .vmrow{display:flex¦;gap:8px¦;margin-top:12px¦;align-items:stretch}\n§ .vmrow>*{flex:1 1 0¦;min-width:0¦}\n§ .vmcell{display:flex¦;flex-direction:column¦;margin:0¦;padding:0¦}\n§ .vml,§ .vbl{font-size:13px¦;line-height:20px¦;font-weight:400¦;color:var(--figma-color-text-secondary)¦}\n§ .vmcell .vmseg{border:1px solid var(--figma-color-border,#dddfe7)¦;border-radius:999px¦;background:var(--figma-color-bg-secondary,#f6f6f8)¦;display:flex¦;box-sizing:border-box¦;width:100%¦;height:36px¦;margin-top:6px¦;padding:2px¦;gap:2px¦;align-self:stretch}\n§ .vmcell .vmseg>button{border-radius:999px¦;background:transparent¦;color:var(--figma-color-text-secondary)¦;font-size:13px¦;flex:1 1 0¦;height:30px¦;min-height:30px¦;padding:0 8px¦;white-space:nowrap}\n§ .vmcell .vmseg>button.on{background:var(--figma-color-bg,#fff)¦;color:var(--figma-color-text,#24272a)¦;font-weight:650¦;box-shadow:0 0 0 1px var(--figma-color-border,#dddfe7)}\n§ .vmcell .vmseg>button:not(.on):hover{background:var(--drn-hover)¦;color:var(--figma-color-text)¦}\n§:has([name=versionMode][value=manual]:checked) .vbl{display:none¦}\n§ .vs #vao{margin-top:14px¦}\n§ .resource-edit-row{box-sizing:border-box¦;border:1px solid var(--figma-color-border)¦;border-radius:8px¦;padding:12px 14px 14px¦;margin:0 0 12px¦;background:transparent¦}\n§ .resource-edit-row>.resource-edit-url{margin-top:8px¦;min-width:0¦;max-width:100%¦}\n§ .resource-edit-row>.resource-edit-url>fig-input-text{display:block¦;box-sizing:border-box¦;width:100%¦;max-width:100%¦}\n§ .resource-edit-url>fig-input-text{box-sizing:border-box¦;height:40px¦;min-height:40px¦;max-height:40px¦;padding:0 12px¦;display:flex¦;align-items:center¦;border-radius:8px¦}\n§ .resource-edit-url>fig-input-text input{height:100%¦;min-height:0¦}\n§ #project-list .resource-edit-url>fig-input-text{height:38px¦;min-height:38px¦;max-height:38px¦}\n§ #entries .resource-edit-line{gap:8px¦;border:0¦;background:none¦;border-radius:0¦;padding:0¦;min-height:0¦;outline:none¦}\n§ #entries .resource-edit-line>.resource-edit-name{box-sizing:border-box¦;height:40px¦;min-height:40px¦;max-height:40px¦;padding:10px 12px 8px¦;line-height:20px¦;resize:none¦;overflow:hidden¦;border:1px solid var(--figma-color-border)¦;border-radius:8px¦;background:var(--figma-color-bg-secondary)¦}\n§ #entries .resource-edit-line>.resource-edit-name:focus-visible{outline:2px solid var(--studio-purple)¦;outline-offset:1px¦}\n§ #project-list .resource-edit-name{line-height:20px¦;padding-top:9px¦;padding-bottom:7px¦;resize:none¦;overflow:hidden¦}\n§ #entries .xc{grid-template-columns:22px minmax(0,1fr) 28px¦;column-gap:4px¦}\n§ #entries .xc>textarea{grid-column:2/3¦;padding-right:10px¦}\n§ #entries .xc:has(>.x9>.x5[data-linked=true])>textarea{padding-right:36px¦}\n§ #entries .xc>.xj{grid-column:2/3¦}\n§ #entries .xc>.x9{display:contents¦}\n§ #entries .xc>.x9>.x5{grid-column:2¦;grid-row:1¦;justify-self:end¦;align-self:start¦;position:relative¦;z-index:1¦;margin:4px 4px 0 0¦;width:24px¦;height:24px¦;min-height:24px¦;padding:4px¦;background:transparent¦;border:0¦;box-shadow:none¦}\n§ #entries .xc>.x9>.x5:not([data-linked=true]){display:none¦}\n§ #entries .xc>.x9>.x5[data-linked=true]{color:var(--figma-color-text-brand,#0d99ff)¦;opacity:1¦;visibility:visible¦}\n§ #entries .xc>.x9>.x5:hover{background:var(--figma-color-bg-hover)¦}\n§ #entries .xc>.x9>.xmore{grid-column:3¦;grid-row:1¦;align-self:start¦;position:relative¦;opacity:0;transition:opacity .12s}\n§ #entries .xc:hover>.x9>.xmore,§ #entries .xc:focus-within>.x9>.xmore,§ #entries .xc>.x9>.xmore[open]{opacity:1}\n§ .xmore>summary{list-style:none¦;display:flex¦;align-items:center¦;justify-content:center¦;width:28px¦;height:32px¦;border-radius:6px¦;color:var(--figma-color-icon-secondary,#999)¦;cursor:pointer}\n§ .xmore>summary::-webkit-details-marker{display:none}\n§ .xmore>summary:hover,§ .xmore[open]>summary{background:var(--figma-color-bg-hover)¦;color:var(--figma-color-icon)¦}\n§ .xmore>.xk{position:absolute¦;right:0¦;top:34px¦;z-index:30¦;display:flex¦;flex-direction:column¦;gap:2px¦;min-width:120px¦;padding:4px¦;border:1px solid var(--figma-color-border)¦;border-radius:8px¦;background:var(--figma-color-bg)¦;box-shadow:0 4px 16px rgba(0,0,0,.3)¦;opacity:1¦}\n§ .xmore>.xk>button.zj{display:flex¦;align-items:center¦;justify-content:flex-start¦;gap:8px¦;width:100%¦;height:30px¦;min-height:30px¦;flex:none¦;padding:0 8px¦;border-radius:6px¦;font-size:13px¦;color:var(--figma-color-text)¦;white-space:nowrap}\n§ .xmore>.xk>button.zj>svg{flex:0 0 14px¦;width:14px¦;height:14px¦}\n§ .xmore>.xk>button.zj:disabled{opacity:.35¦}\n§ .xmore>.xk>button.xlink-item::after{content:\"加入連結\"}\n§ .xc:has(>.x9>.x5[data-linked=true]) .xmore>.xk>button.xlink-item::after{content:\"編輯連結\"}\n§ .xmore>.xk>button.xlink-item{border-bottom:0¦;margin-bottom:2px¦}\n§ .xmore>.xk>button[data-item-action=up]::after{content:\"上移\"}\n§ .xmore>.xk>button[data-item-action=down]::after{content:\"下移\"}\n§ .xmore>.xk>button[data-item-action=delete]::after{content:\"刪除\"}\nhtml[lang=en] § .xmore>.xk>button.xlink-item::after{content:\"Add link\"}\nhtml[lang=en] § .xc:has(>.x9>.x5[data-linked=true]) .xmore>.xk>button.xlink-item::after{content:\"Edit link\"}\nhtml[lang=en] § .xmore>.xk>button[data-item-action=up]::after{content:\"Move up\"}\nhtml[lang=en] § .xmore>.xk>button[data-item-action=down]::after{content:\"Move down\"}\nhtml[lang=en] § .xmore>.xk>button[data-item-action=delete]::after{content:\"Delete\"}\n§ .xmore>.xk>button[data-item-action=delete]:not(:disabled){color:var(--figma-color-text-danger,#f24822)¦}\n</style>"], ["document.querySelectorAll(\"[data-vm]\").forEach(b=>b.classList.toggle(\"on\",b.dataset.vm==m()));", "document.querySelectorAll(\"[data-vm]\").forEach(b=>b.classList.toggle(\"on\",b.dataset.vm==m()));{let vs=document.getElementById(\"vmsel\");if(vs&&vs.value!=m()){vs.value=m();vs.dispatchEvent(new Event(\"drn-sync\"))}}"], ["function X(e){if(\"link\"===e)return", "function X(e){if(\"delete\"===e)return'<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6\"/></svg>';if(\"link\"===e)return"], ["<div class=yf><label for=theme>卡片主題</label><select id=theme>", "<div class=yf><select id=theme aria-label=\"卡片主題\">"], ["\\n<div class=\"xk\">${[\"up\",\"down\",\"delete\"].map(", "\\n<details class=\"xmore\"><summary class=\"xmore-btn\" aria-label=\"${o}更多操作\"><svg viewBox=\"0 0 20 20\" width=\"20\" height=\"20\" fill=\"currentColor\" aria-hidden=\"true\"><circle cx=\"4\" cy=\"10\" r=\"1.7\"/><circle cx=\"10\" cy=\"10\" r=\"1.7\"/><circle cx=\"16\" cy=\"10\" r=\"1.7\"/></svg></summary><div class=\"xk\"><button type=\"button\" class=\"zj xlink-item\" data-item-action=\"toggle-link\" aria-label=\"連結${o}\">${X(\"link\")}</button>${[\"up\",\"down\",\"delete\"].map("], [".join(\"\")}</div>\\n</div>\\n<div class=\"xj\"", ".join(\"\")}</div></details>\\n</div>\\n<div class=\"xj\""], ["</body>", "<script>document.addEventListener(\"click\",function(e){document.querySelectorAll(\"details.xmore[open]\").forEach(function(d){if(!d.contains(e.target)||e.target.closest(\".xk button\"))d.open=false})},true)</script></body>"], ["M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6", "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"], ["line.append(kind,name,attach,remove);urlbox.append(url);item.append(line,urlbox,error);", "urlbox.append(url);const nameBox=line.ownerDocument.createElement('div');nameBox.className='resource-name-box';nameBox.append(name);const indexLabel=document.createElement('span');indexLabel.className='project-resource-index';indexLabel.textContent=String(i+1).padStart(2,'0');line.append(indexLabel,kind,nameBox,urlbox,remove);item.append(line,error);"], ["line.append(name,remove);const urlbox", "const urlbox"], ["urlbox.append(url);row.append(line,urlbox);", "urlbox.append(url);const nameBox=line.ownerDocument.createElement('div');nameBox.className='resource-name-box';nameBox.innerHTML='<svg class=\"resource-url-icon\" viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M10 13a4 4 0 0 0 6 .5l4-4a4 4 0 0 0-5.7-5.7L12 6m2 5a4 4 0 0 0-6-.5l-4 4a4 4 0 0 0 5.7 5.7L12 18\"/></svg>';nameBox.append(name);line.append(nameBox,urlbox,remove);row.append(line);"], ["row.querySelector(\".x5\").setAttribute(\"aria-expanded\",\"true\");", ""], ["</body>", "<style>\n§ :is(#entries,#project-list) .resource-edit-row{border:0¦;padding:0¦;margin:0 0 8px¦}\n§ :is(#entries,#project-list) .resource-edit-line{display:flex¦;align-items:center¦;gap:8px¦}\n§ :is(#entries,#project-list) .resource-edit-line>.resource-edit-name{flex:1 1 0¦;width:0¦;min-width:0¦;height:38px¦;min-height:38px¦;max-height:38px¦}\n§ :is(#entries,#project-list) .resource-edit-line>.resource-edit-url{flex:1.25 1 0;min-width:0;margin:0¦}\n§ :is(#entries,#project-list) .resource-edit-url>fig-input-text{box-sizing:border-box;width:100%;min-width:0;height:38px¦;min-height:38px¦;max-height:38px¦;background:var(--figma-color-bg-secondary)¦;border:1px solid var(--figma-color-border);border-radius:8px}\n§ .resource-edit-url input{min-width:0;text-overflow:ellipsis}\n§ .resource-edit-url input:focus{text-overflow:clip}\n</style></body>"], ["資源名稱，例如：UX 設計稿（選填）", "資源名稱"], ["Resource name, e.g. UX design (optional)", "Resource name"], ["</body>", "<style>\n§ :is(#entries,#project-list) .resource-edit-line>.resource-edit-name{white-space:nowrap¦;text-overflow:ellipsis¦}\n</style></body>"], ["</body>", "<style>\n§ .resource-name-box{display:flex;align-items:center;gap:8px;flex:0 1 34%;min-width:0}\n§ .resource-name-box>.resource-url-icon{flex:0 0 14px;pointer-events:none;color:var(--figma-color-icon-brand,#79baff);z-index:1}\n§ :is(#entries,#project-list) .resource-name-box>.resource-edit-name{box-sizing:border-box;display:block;flex:1;min-width:0;width:0;height:38px;resize:none;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:8px 10px;line-height:20px;border:1px solid var(--figma-color-border);border-radius:8px;background:var(--figma-color-bg-secondary);color:var(--figma-color-text);font:inherit}\n§ .resource-name-box>.resource-edit-name:focus-visible{outline:2px solid var(--studio-purple);outline-offset:1px}\n</style></body>"], ["</body>", "<style>\n§ #entries .xc>.x9>.xmore{opacity:1¦}\n§ .xmore>summary.xmore-btn{color:var(--figma-color-icon,#e6e6e6)¦}\n§ .xmore>summary.xmore-btn>svg{display:block¦;width:20px¦;height:20px¦;flex:none¦}\n</style></body>"], ["</body>", "<style>\n§ fig-input-text[data-field=\"description\"] textarea,§ fig-input-text[data-field=\"description\"]::part(textarea){padding-block:3px 0¦;min-height:23px¦;line-height:20px¦}\n§ .resource-name-box>.resource-edit-name{padding-block:9px 7px}\n§ #entries .xc>textarea[data-item-field=\"text\"]{padding-block:6px 4px¦}\n§ #entries .xc>.x9>.xmore{align-self:center¦;justify-self:center¦}\n§ #entries .xmore>summary.xmore-btn{box-sizing:border-box¦;padding:0¦;margin:0¦;display:grid¦;place-items:center¦;position:relative¦}\n§ #entries .xmore>summary.xmore-btn>svg{position:static¦;margin:0¦;transform:none¦}\n</style></body>"], ["</body>", "<style>§ #entries .xmore>summary.xmore-btn::before,§ #entries .xmore>summary.xmore-btn::after{content:none¦;display:none¦}</style></body>"], ["貼上 Figma 畫面、Prototype 或文件網址", "https://"], ["</body>", "<style>§ #entries .xc:has(>.x9>.xmore){box-sizing:border-box¦;padding-inline-end:14px¦}§ #entries .xc>.x9>.xmore{justify-self:end¦}</style></body>"], ["</body>", "<style>§ :is(#entries,#project-list) .resource-name-box>.resource-edit-name{box-sizing:border-box¦;height:38px¦;line-height:20px¦;padding-block:8px¦;margin-block:0¦}</style></body>"], ["簡短說明這次的變更。小變更寫這裡就好，不必新增變更項目。", "簡短說明這次的變更"], ["Briefly describe this release. For a small change this is enough; no change items needed.", "Briefly describe this release"], ["</body>", "<style>#plugin-root #project-list .project-resource-index{flex:0 0 17px;align-self:center;font-size:12px;line-height:20px;font-variant-numeric:tabular-nums;color:var(--figma-color-text-secondary)}</style></body>"], ["</body>", "<style>§ #project-list .project-kind{flex:0 0 44px¦}§ #project-list .project-icon-trigger{gap:3px¦;font-size:14px¦}§ #project-list .project-icon-trigger>span:not(.project-icon-chevron){font-size:14px¦}§ #project-list .project-icon-trigger svg{width:14px¦;height:14px¦}</style></body>"], ["<div class=\"zm sc\"><h3>卡片外觀</h3>", "<div class=\"zm sc\" id=\"card-appearance\"><h3>卡片外觀</h3>"], ["</body>", "<script>{const appearance=document.getElementById('card-appearance');const panel=appearance?.closest('#panel-style');if(panel){const reset=panel.querySelector('#reset')?.closest('.xh');panel.insertBefore(appearance,reset?.parentElement===panel?reset:null)}}</script></body>"], ["</body>", "<style>#plugin-root #project-list .resource-name-box{flex-basis:31%}</style></body>"], ["</body>", "<style>§ #project-list:not(:empty)~#project-add{margin-top:8px¦}</style><script>{const panel=document.getElementById('panel-style');const version=panel?.querySelector('.vs');const display=panel?.querySelector('#outputVersionLimit')?.closest('.zm');if(version&&display&&version.parentNode===display.parentNode){const position=document.createComment('version settings');version.before(position);display.before(version);position.replaceWith(display)}}</script></body>"], ["</body>", "<style>§ #vmsel:hover{background-image:var(--drn-chevron)¦;background-position:right 10px center¦;background-repeat:no-repeat¦;background-size:12px¦}</style></body>"], ["</body>", "<style>\n§ details.yl>.group-summary{display:flex¦;align-items:center¦;gap:8px¦}\n§ details.yl:not([open])>.group-summary>.group-preview{display:block¦;visibility:visible¦;opacity:1¦;flex:1 1 0¦;min-width:0¦;width:auto¦}\n§ details.yl>.group-summary>.group-more{margin-left:auto¦;flex:0 0 auto¦;position:relative¦;opacity:1¦}\n</style></body>"], ["● 變更尚未套用到卡片", "● 變更尚未套用"], ["● 變更尚未套用|● Not applied to the card yet", "● 變更尚未套用|● Not applied yet"], ["${e.map((e,t)=>`<button type=\"button\" class=\"zz\" role=\"radio\"", "${e.filter(x=>\"Deprecated\"!==x||\"Deprecated\"===a.status).map((e,t)=>`<button type=\"button\" class=\"zz\" role=\"radio\""], ["Released：已發布 · Deprecated：已棄用|Released: published · Deprecated: no longer in use", "Released：已發布|Released: published"], ["Released：已發布 · Deprecated：已棄用", "Released：已發布"], ["Draft：草稿 · In Review：審查中 · Released：已交付 · Deprecated：已棄用|Draft: in progress · In Review: being reviewed · Released: delivered · Deprecated: no longer used", "Draft：草稿 · In Review：審查中 · Released：已交付|Draft: in progress · In Review: being reviewed · Released: delivered"], ["預設顯示審查中、已發布與已棄用版本；若要包含草稿，請在「設定」開啟「草稿版本」。|In Review, Released and Deprecated versions are shown by default. To include Draft, turn on Draft versions in Settings.", "預設顯示審查中與已發布版本；若要包含草稿，請在「設定」開啟「草稿版本」。|In Review and Released versions are shown by default. To include Draft, turn on Draft versions in Settings."], ["預設顯示審查中、已發布與已棄用版本；", "預設顯示審查中與已發布版本；"], ["已超過可刪除期限，請改為 Deprecated", "已超過可刪除期限"], ["The deletion window has expired. Mark it Deprecated", "The deletion window has expired"], ["，其餘已發布版本請改為 Deprecated。", "。"], [" Mark older published versions Deprecated.", ""], ["Choose a status: Draft, In Review, Released or Deprecated.", "Choose a status: Draft, In Review or Released."], ["Choose Draft, In Review, Released or Deprecated; legacy tags are kept.", "Choose Draft, In Review or Released; legacy tags are kept."], ["</body>", "<style>§ .yp[data-shipped] .yh [data-action=\"delete\"]{display:none¦}</style></body>"]]
function patchedUi():S{const call="parseFromString(text, 'text/html')";if(__html__.indexOf(call)<0)return __html__;const X=(s:S):S=>s.split('§').join('#plugin-root#plugin-root').split('¦').join('!important');const data=JSON.stringify(UI_PATCHES.map(p=>[X(p[0]),X(p[1])])).replace(/</g,'\\u003c');return __html__.split(call).join('parseFromString((t=>{for(const[a,b]of '+data+')t=t.split(a).join(b);return t})(text),\'text/html\')')}
figma.showUI(patchedUi(),{width:520,height:800,themeColors:true})
figma.on('selectionchange',fn11)
figma.ui.onmessage=async(m:Msg):Promise<void>=>{
if(m.type==='delete-check'){let code='';try{if(ex)code='busy';else{const node=await figma.getNodeByIdAsync(m.targetId),doc=node?.type==='FRAME'?fn8(node):null,entry=doc?.entries.find(e=>e.rid===m.rid);code=db(entry,doc?.latestId,m.count,Array.isArray(m.unlockedIds)?m.unlockedIds:[]);if(!code&&entry&&SS.includes(entry.status))DP.add(m.targetId+':'+m.rid)}}catch{code='missing'}figma.ui.postMessage({type:'delete-check',requestId:m.requestId,code});return}
if(m.type==='asset'){
try{
if(ex)throw new VE('儲存中，請稍後再讀取附件。')
const source=m.sourceId ? await figma.getNodeByIdAsync(m.sourceId):null
const rt=source?.type==='FRAME'&&source.getPluginData(RK)==='1' ? source:null
const document=rt&&fn8(rt)
const asset=document&&fn1(document).find((item)=>item.id===m.id)
if(!asset)throw new VE('無法找到附件，請回到原卡片讀取；原資料仍保留。')
const bytes=await ct4(asset,rt)
figma.ui.postMessage({type:'asset-result',requestId:m.requestId,asset,bytes})
}catch(error){
figma.ui.postMessage({type:'asset-result',requestId:m.requestId,error:error instanceof Error ? error.message:String(error)})
}
}else if(m.type==='resize'){
if(Number.isFinite(m.height))figma.ui.resize(520,Math.max(600,Math.min(900,Math.round(m.height))))
}else if(m.type==='ready'){
const rt=fn9()
const document=rt ? fn8(rt):null
figma.ui.postMessage({type:'restore',targetId:document&&rt ? rt.id:null,document:document ?? defaults()})
fn11()
}else if(m.type==='save'&&(m.action==='create'||m.action==='update')){
await save(m)
}
}