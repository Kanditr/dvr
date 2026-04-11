import { useRef } from 'react';

export type UploadState = 'idle' | 'loading' | 'done';

interface DocumentUploadGateProps {
  docLabel: string;
  uploadState: UploadState;
  onUpload: (file: File) => void;
  children: React.ReactNode;
}

export default function DocumentUploadGate({ docLabel, uploadState, onUpload, children }: DocumentUploadGateProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) { onUpload(file); }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  if (uploadState === 'done') return <>{children}</>;

  if (uploadState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-[#0056b8] border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">Processing document...</p>
        </div>
      </div>
    );
  }

  // idle
  return (
    <div className="flex items-center justify-center py-12 px-6">
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff" className="hidden" onChange={onFileChange} />
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="w-full max-w-md border-2 border-dashed border-gray-300 hover:border-[#0056b8] hover:bg-gray-50 rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors"
      >
        <div className="w-14 h-14 rounded-full bg-[#e8f0fb] flex items-center justify-center">
          <svg className="w-7 h-7 text-[#0056b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">Upload {docLabel}</p>
          <p className="text-xs text-gray-500 mt-1">Drag & drop or <span className="text-[#0056b8] font-medium">browse file</span></p>
          <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, TIFF supported</p>
        </div>
      </div>
    </div>
  );
}
