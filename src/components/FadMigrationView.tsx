import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Database, Download, FileArchive, History, Layers3, ShieldCheck, Upload, XCircle } from 'lucide-react';
import { inspectFadFile, type BizOneTargetDomain, type FadSourceFile } from '../utils/fadMigrationEngine';
import { buildDryRunManifest, downloadManifest, type FadMigrationManifest } from '../utils/fadMigrationManifest';

type InspectedFile = { source: FadSourceFile; domains: BizOneTargetDomain[]; strings: string[]; jsonFragments: unknown[] };
type ServerValidation = { valid: boolean; manifestFingerprint: string; errors: Array<{ index: number; errors: string[] }>; ready: number; review: number; rejected: number };
type MigrationHistory = { migrationId: string; createdAt: string; completedAt?: string; status: string; fileCount: number; recordCount: number; importedCount: number; skippedCount: number; rejectedCount: number; reviewCount: number; manifestFingerprint: string; };

const DOMAIN_LABELS: Record<BizOneTargetDomain, string> = { iam: 'Tài khoản & phân quyền', configuration: 'Cấu hình', products: 'Sản phẩm & SKU', inventory: 'Kho & tồn', sales: 'Bán hàng', purchasing: 'Mua hàng', crm: 'CRM', pricing: 'Giá & chính sách giá', marketing: 'Khuyến mãi & marketing', finance: 'Tài chính', omnichannel: 'Omnichannel', unknown: 'Chưa xác định' };
const formatBytes = (v: number) => v < 1024 ? `${v} B` : v < 1048576 ? `${(v / 1024).toFixed(1)} KB` : `${(v / 1048576).toFixed(2)} MB`;

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || body?.validation?.errors?.[0]?.errors?.join(', ') || `API ${response.status}`);
  return body as T;
}

export const FadMigrationView: React.FC = () => {
  const [files, setFiles] = useState<InspectedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload'|'preview'|'mapping'|'import'>('upload');
  const [selectedFile, setSelectedFile] = useState('');
  const [manifest, setManifest] = useState<FadMigrationManifest | null>(null);
  const [validation, setValidation] = useState<ServerValidation | null>(null);
  const [migration, setMigration] = useState<MigrationHistory | null>(null);
  const [history, setHistory] = useState<MigrationHistory[]>([]);
  const selected = useMemo(() => files.find(x => x.source.fileName === selectedFile) ?? files[0], [files, selectedFile]);
  const totalStrings = files.reduce((n, x) => n + x.strings.length, 0);
  const totalJson = files.reduce((n, x) => n + x.jsonFragments.length, 0);
  const mappedFiles = files.filter(x => !x.domains.includes('unknown')).length;

  const inspectFiles = async (incoming: FileList | null) => {
    if (!incoming?.length) return;
    setBusy(true); setError(''); setValidation(null); setMigration(null);
    try {
      const hive = Array.from(incoming).filter(f => /\.hive$/i.test(f.name));
      if (!hive.length) throw new Error('Chưa chọn file .hive hợp lệ.');
      const inspected: InspectedFile[] = [];
      for (const f of hive) inspected.push(await inspectFadFile(f));
      setFiles(inspected); setSelectedFile(inspected[0]?.source.fileName ?? ''); setManifest(null); setStep('preview');
    } catch(e) { setError(e instanceof Error ? e.message : 'Không thể phân tích file FAD.'); }
    finally { setBusy(false); }
  };

  const runDryRun = async () => {
    setBusy(true); setError(''); setValidation(null); setMigration(null);
    try {
      const next = await buildDryRunManifest(files);
      setManifest(next);
      const result = await apiJson<{ success: boolean; validation: ServerValidation }>('/api/core/fad-migrations/validate', { method: 'POST', body: JSON.stringify(next) });
      setValidation(result.validation);
      setStep('import');
      if (!result.validation.valid) setError('Backend từ chối manifest. Kiểm tra các lỗi validation trước khi import.');
    } catch(e) { setError(e instanceof Error ? e.message : 'Không thể validate manifest với backend.'); }
    finally { setBusy(false); }
  };

  const importManifest = async () => {
    if (!manifest || !validation?.valid) return;
    setBusy(true); setError('');
    try {
      const result = await apiJson<{ success: boolean; migration: MigrationHistory }>('/api/core/fad-migrations/import', { method: 'POST', body: JSON.stringify(manifest) });
      setMigration(result.migration);
      const h = await apiJson<{ history: MigrationHistory[] }>('/api/core/fad-migrations/history?limit=20');
      setHistory(h.history);
    } catch(e) { setError(e instanceof Error ? e.message : 'Import FAD thất bại.'); }
    finally { setBusy(false); }
  };

  const loadHistory = async () => {
    try { const result = await apiJson<{ history: MigrationHistory[] }>('/api/core/fad-migrations/history?limit=20'); setHistory(result.history); }
    catch(e) { setError(e instanceof Error ? e.message : 'Không thể tải lịch sử migration.'); }
  };

  const reset = () => { setFiles([]); setSelectedFile(''); setManifest(null); setValidation(null); setMigration(null); setHistory([]); setError(''); setStep('upload'); };

  return <div className="min-h-full bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8"><div className="max-w-7xl mx-auto space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold text-blue-600"><Database size={17}/> BizOne Data Migration</div><h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">FAD → BizOne ERP</h1><p className="text-sm text-slate-500 mt-1 max-w-3xl">Phân tích .hive → preview → mapping → dry-run → backend validate → import. File .hive không được upload lên server.</p></div>{files.length > 0 && <button onClick={reset} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm font-medium"><XCircle size={16}/> Làm lại</button>}</div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['File .hive',files.length,FileArchive],['Chuỗi đọc được',totalStrings,Layers3],['JSON fragment',totalJson,Database],['File đã mapping',mappedFiles,CheckCircle2]].map(([label,value,Icon]:any)=><div key={label} className="bg-white border rounded-xl p-4 shadow-sm"><div className="text-xs text-slate-500 flex items-center gap-2"><Icon size={15}/> {label}</div><div className="text-2xl font-bold mt-1">{value}</div></div>)}</div>
    <div className="bg-white border rounded-xl p-2 overflow-x-auto"><div className="flex min-w-max items-center gap-1">{(['upload','preview','mapping','import'] as const).map((item,i)=>{const labels=['1. Phân tích','2. Preview','3. Mapping','4. Import']; return <React.Fragment key={item}><button onClick={()=>((item==='upload'||files.length)?setStep(item):null)} className={`px-3 py-2 rounded-lg text-sm font-medium ${step===item?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-100'}`}>{labels[i]}</button>{i<3&&<ArrowRight size={14} className="text-slate-300"/>}</React.Fragment>})}</div></div>
    {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-2"><AlertTriangle size={18}/>{error}</div>}
    {step==='upload'&&<label className="block bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 sm:p-14 text-center cursor-pointer"><input type="file" multiple accept=".hive,application/octet-stream" className="hidden" onChange={e=>void inspectFiles(e.target.files)}/><div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Upload size={26}/></div><h2 className="font-semibold text-lg mt-4">Chọn dữ liệu FAD (.hive)</h2><p className="text-sm text-slate-500 mt-1">Có thể chọn nhiều file. Phân tích thực hiện cục bộ trên trình duyệt.</p><span className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold">{busy?'Đang phân tích…':'Chọn file'}</span></label>}
    {step==='preview'&&files.length>0&&<div className="grid lg:grid-cols-[300px_1fr] gap-4"><div className="bg-white border rounded-xl overflow-hidden"><div className="px-4 py-3 border-b font-semibold text-sm">Nguồn dữ liệu</div>{files.map(x=><button key={x.source.fileName} onClick={()=>setSelectedFile(x.source.fileName)} className={`w-full text-left px-4 py-3 border-b ${selected?.source.fileName===x.source.fileName?'bg-blue-50':'hover:bg-slate-50'}`}><div className="font-medium text-sm truncate">{x.source.fileName}</div><div className="text-xs text-slate-500 mt-1">{formatBytes(x.source.byteLength)} · {x.strings.length} chuỗi</div></button>)}</div>{selected&&<div className="space-y-4"><div className="bg-white border rounded-xl p-5"><h2 className="font-semibold">{selected.source.sourceTable}</h2><p className="text-xs text-slate-500 mt-1">source_system=FAD · source_table={selected.source.sourceTable}</p><div className="flex flex-wrap gap-2 mt-4">{selected.domains.map(d=><span key={d} className="text-xs px-2.5 py-1 rounded-full bg-slate-100">{DOMAIN_LABELS[d]}</span>)}</div></div><div className="bg-white border rounded-xl p-5"><div className="flex justify-between mb-3"><h3 className="font-semibold">Readable strings</h3><span className="text-xs text-slate-500">{selected.strings.length} mục</span></div><div className="max-h-72 overflow-auto space-y-1">{selected.strings.slice(0,250).map((v,i)=><div key={`${i}-${v}`} className="font-mono text-xs bg-slate-50 border rounded px-2 py-1 break-all">{v}</div>)}</div></div><div className="flex justify-end"><button onClick={()=>setStep('mapping')} className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold">Tiếp tục Mapping</button></div></div>}</div>}
    {step==='mapping'&&files.length>0&&<div className="bg-white border rounded-xl overflow-hidden"><div className="p-5 border-b"><h2 className="font-semibold">Mapping FAD → BizOne</h2><p className="text-sm text-slate-500 mt-1">Mapping độc lập theo domain, không sao chép implementation nguồn.</p></div><div className="divide-y">{files.map(x=><div key={x.source.fileName} className="p-4 grid md:grid-cols-[260px_1fr_auto] gap-3 items-center"><div className="font-medium text-sm">{x.source.fileName}</div><div className="flex flex-wrap gap-2">{x.domains.map(d=><span key={d} className={`text-xs px-2 py-1 rounded-md ${d==='unknown'?'bg-amber-50 text-amber-700':'bg-blue-50 text-blue-700'}`}>{DOMAIN_LABELS[d]}</span>)}</div>{x.domains.includes('unknown')?<AlertTriangle className="text-amber-500" size={18}/>:<CheckCircle2 className="text-emerald-500" size={18}/>}</div>)}</div><div className="p-4 border-t flex justify-end"><button onClick={()=>void runDryRun()} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-50">{busy?'Đang validate…':'Dry-run + Validate'}</button></div></div>}
    {step==='import'&&<div className="space-y-4"><div className="bg-white border rounded-2xl p-6"><div className="flex items-start gap-4"><ShieldCheck className="text-amber-600 shrink-0"/><div className="flex-1"><h2 className="font-semibold text-lg">Server validation & import</h2><p className="text-sm text-slate-600 mt-1">Chỉ record trạng thái <b>ready</b> mới được đưa vào vùng dữ liệu migration của Tenant. Review/rejected không được tự động nhập.</p>{manifest&&<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">{[['Records',manifest.summary.records],['Ready',manifest.summary.ready],['Review',manifest.summary.review],['Rejected',manifest.summary.rejected]].map(([l,v])=><div key={l} className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">{l}</div><div className="font-semibold text-lg mt-1">{v}</div></div>)}</div>}{validation&&<div className={`mt-4 rounded-lg p-3 text-sm ${validation.valid?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}`}>{validation.valid?<span className="flex items-center gap-2"><CheckCircle2 size={17}/> Backend validation PASS · {validation.manifestFingerprint.slice(0,16)}…</span>:<span>Backend validation FAIL · {validation.errors.length} lỗi</span>}</div>}<div className="mt-5 flex flex-wrap gap-2">{manifest&&<button onClick={()=>downloadManifest(manifest)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold"><Download size={16}/> Xuất manifest JSON</button>}{validation?.valid&&<button onClick={()=>void importManifest()} disabled={busy||!!migration} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">{busy?'Đang import…':migration?'Đã import':'Import vào Tenant'}</button>}<button onClick={()=>void loadHistory()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm font-semibold"><History size={16}/> Lịch sử</button></div></div></div></div>{validation&&!validation.valid&&<div className="bg-white border rounded-xl p-4"><h3 className="font-semibold">Validation errors</h3><div className="mt-2 space-y-1 text-xs text-red-700 max-h-48 overflow-auto">{validation.errors.slice(0,100).map((e,i)=><div key={i}>Record {e.index < 0 ? 'manifest' : e.index}: {e.errors.join('; ')}</div>)}</div></div>}{migration&&<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5"><div className="font-semibold text-emerald-800">Import hoàn tất: {migration.migrationId}</div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm"><div>Imported <b>{migration.importedCount}</b></div><div>Skipped <b>{migration.skippedCount}</b></div><div>Review <b>{migration.reviewCount}</b></div><div>Rejected <b>{migration.rejectedCount}</b></div></div></div>}{history.length>0&&<div className="bg-white border rounded-xl overflow-hidden"><div className="p-4 border-b font-semibold flex items-center gap-2"><History size={17}/> Migration history</div><div className="overflow-auto"><table className="min-w-full text-xs"><thead className="bg-slate-50"><tr><th className="text-left p-3">Migration</th><th className="text-left p-3">Time</th><th className="text-left p-3">Status</th><th className="text-right p-3">Imported</th><th className="text-right p-3">Skipped</th><th className="text-right p-3">Review</th></tr></thead><tbody>{history.map(h=><tr key={h.migrationId} className="border-t"><td className="p-3 font-mono">{h.migrationId}</td><td className="p-3">{new Date(h.createdAt).toLocaleString('vi-VN')}</td><td className="p-3">{h.status}</td><td className="p-3 text-right">{h.importedCount}</td><td className="p-3 text-right">{h.skippedCount}</td><td className="p-3 text-right">{h.reviewCount}</td></tr>)}</tbody></table></div></div>}</div>}
    <div className="text-xs text-slate-400 flex items-center gap-2"><History size={14}/> FAD là nguồn tham chiếu; provenance dùng source_system/source_table/source_id. Backend hiện lưu vùng migration riêng theo Tenant, chưa tự động ghi thẳng vào bảng nghiệp vụ Product/Inventory/CRM.</div>
  </div></div>;
};
export default FadMigrationView;
