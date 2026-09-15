import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Database, FileArchive, FileUp, History, Layers3, ShieldCheck, Upload, XCircle } from 'lucide-react';
import { inspectFadFile, type BizOneTargetDomain, type FadSourceFile } from '../utils/fadMigrationEngine';

type InspectedFile = {
  source: FadSourceFile;
  domains: BizOneTargetDomain[];
  strings: string[];
  jsonFragments: unknown[];
};

const DOMAIN_LABELS: Record<BizOneTargetDomain, string> = {
  iam: 'Tài khoản & phân quyền',
  configuration: 'Cấu hình',
  products: 'Sản phẩm & SKU',
  inventory: 'Kho & tồn',
  sales: 'Bán hàng',
  purchasing: 'Mua hàng',
  crm: 'CRM',
  pricing: 'Giá & chính sách giá',
  marketing: 'Khuyến mãi & marketing',
  finance: 'Tài chính',
  omnichannel: 'Omnichannel',
  unknown: 'Chưa xác định'
};

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
};

export const FadMigrationView: React.FC = () => {
  const [files, setFiles] = useState<InspectedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'import'>('upload');
  const [selectedFile, setSelectedFile] = useState<string>('');

  const selected = useMemo(() => files.find((item) => item.source.fileName === selectedFile) ?? files[0], [files, selectedFile]);
  const totalStrings = files.reduce((sum, item) => sum + item.strings.length, 0);
  const totalJson = files.reduce((sum, item) => sum + item.jsonFragments.length, 0);
  const mappedFiles = files.filter((item) => !item.domains.includes('unknown')).length;

  const inspectFiles = async (incoming: FileList | null) => {
    if (!incoming?.length) return;
    setBusy(true);
    setError('');
    try {
      const hiveFiles = Array.from(incoming).filter((file) => /\.hive$/i.test(file.name));
      if (!hiveFiles.length) throw new Error('Chưa chọn file .hive hợp lệ.');
      const inspected: InspectedFile[] = [];
      for (const file of hiveFiles) inspected.push(await inspectFadFile(file));
      setFiles(inspected);
      setSelectedFile(inspected[0]?.source.fileName ?? '');
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể phân tích file FAD.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setSelectedFile('');
    setError('');
    setStep('upload');
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600"><Database size={17} /> BizOne Data Migration</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">FAD → BizOne ERP</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">Phân tích dữ liệu .hive, xác định domain, xem trước mapping và tạo manifest migration. Không ghi dữ liệu ERP khi chưa vượt qua bước kiểm tra.</p>
          </div>
          {files.length > 0 && <button onClick={reset} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50"><XCircle size={16} /> Làm lại</button>}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[['File .hive', files.length, FileArchive], ['Chuỗi đọc được', totalStrings, Layers3], ['JSON fragment', totalJson, Database], ['File đã mapping', mappedFiles, CheckCircle2]].map(([label, value, Icon]: any) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"><div className="text-xs text-slate-500 flex items-center gap-2"><Icon size={15} /> {label}</div><div className="text-2xl font-bold mt-1">{value}</div></div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2 overflow-x-auto">
          <div className="flex min-w-max items-center gap-1">
            {(['upload', 'preview', 'mapping', 'import'] as const).map((item, index) => {
              const labels = ['1. Phân tích', '2. Preview', '3. Mapping', '4. Import'];
              const active = step === item;
              return <React.Fragment key={item}><button onClick={() => (item === 'upload' || files.length ? setStep(item) : null)} className={`px-3 py-2 rounded-lg text-sm font-medium ${active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{labels[index]}</button>{index < 3 && <ArrowRight size={14} className="text-slate-300" />}</React.Fragment>;
            })}
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-2"><AlertTriangle size={18} className="shrink-0" />{error}</div>}

        {step === 'upload' && (
          <label className="block bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-colors">
            <input type="file" multiple accept=".hive,application/octet-stream" className="hidden" onChange={(event) => void inspectFiles(event.target.files)} />
            <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Upload size={26} /></div>
            <h2 className="font-semibold text-lg mt-4">Chọn dữ liệu FAD (.hive)</h2>
            <p className="text-sm text-slate-500 mt-1">Có thể chọn nhiều file cùng lúc. Dữ liệu được phân tích ngay trên trình duyệt.</p>
            <span className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold">{busy ? 'Đang phân tích…' : 'Chọn file'}</span>
          </label>
        )}

        {step === 'preview' && files.length > 0 && (
          <div className="grid lg:grid-cols-[300px_1fr] gap-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b font-semibold text-sm">Nguồn dữ liệu</div>
              {files.map((item) => <button key={item.source.fileName} onClick={() => setSelectedFile(item.source.fileName)} className={`w-full text-left px-4 py-3 border-b last:border-0 ${selected?.source.fileName === item.source.fileName ? 'bg-blue-50' : 'hover:bg-slate-50'}`}><div className="font-medium text-sm truncate">{item.source.fileName}</div><div className="text-xs text-slate-500 mt-1">{formatBytes(item.source.byteLength)} · {item.strings.length} chuỗi</div></button>)}
            </div>
            {selected && <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{selected.source.sourceTable}</h2><p className="text-xs text-slate-500 mt-1">source_system=FAD · source_table={selected.source.sourceTable}</p></div><span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Analysis only</span></div>
                <div className="flex flex-wrap gap-2 mt-4">{selected.domains.map((domain) => <span key={domain} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{DOMAIN_LABELS[domain]}</span>)}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Readable strings</h3><span className="text-xs text-slate-500">{selected.strings.length} mục</span></div><div className="max-h-72 overflow-auto space-y-1">{selected.strings.slice(0, 250).map((value, index) => <div key={`${index}-${value}`} className="font-mono text-xs bg-slate-50 border border-slate-100 rounded px-2 py-1 break-all">{value}</div>)}</div></div>
            </div>}
          </div>
        )}

        {step === 'mapping' && files.length > 0 && <div className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="p-5 border-b"><h2 className="font-semibold">Mapping FAD → BizOne</h2><p className="text-sm text-slate-500 mt-1">Mapping nghiệp vụ độc lập; không sao chép implementation của ứng dụng nguồn.</p></div><div className="divide-y">{files.map((item) => <div key={item.source.fileName} className="p-4 grid md:grid-cols-[260px_1fr_auto] gap-3 items-center"><div className="font-medium text-sm">{item.source.fileName}</div><div className="flex flex-wrap gap-2">{item.domains.map((domain) => <span key={domain} className={`text-xs px-2 py-1 rounded-md ${domain === 'unknown' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{DOMAIN_LABELS[domain]}</span>)}</div>{item.domains.includes('unknown') ? <AlertTriangle className="text-amber-500" size={18} /> : <CheckCircle2 className="text-emerald-500" size={18} />}</div>)}</div></div>}

        {step === 'import' && files.length > 0 && <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8"><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><ShieldCheck size={22} /></div><div><h2 className="font-semibold text-lg">Import an toàn</h2><p className="text-sm text-slate-600 mt-1">Chưa tự động ghi dữ liệu vào các bảng nghiệp vụ. Vì .hive là định dạng binary không có schema công khai, BizOne chỉ cho phép chuyển sang bước import sau khi field-level decoder được xác thực trên dữ liệu thực tế.</p><div className="mt-5 grid sm:grid-cols-3 gap-3"><div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Nguồn</div><div className="font-semibold mt-1">{files.length} file</div></div><div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Mapping</div><div className="font-semibold mt-1">{mappedFiles}/{files.length}</div></div><div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Ghi dữ liệu</div><div className="font-semibold mt-1 text-amber-700">Chưa thực hiện</div></div></div></div></div><div className="mt-6 border-t pt-5 flex items-center gap-2 text-xs text-slate-500"><History size={15} /> Manifest migration sẽ là bước tiếp theo sau khi xác thực decoder.</div></div>}

        <div className="text-xs text-slate-400 flex items-center gap-2"><ShieldCheck size={14} /> FAD được dùng làm nguồn tham chiếu dữ liệu/nghiệp vụ; BizOne giữ data provenance bằng source_system/source_table/source_id.</div>
      </div>
    </div>
  );
};

export default FadMigrationView;
