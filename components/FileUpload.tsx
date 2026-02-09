import React from 'react';
import NeoCard from './NeoCard';
import { Upload, Activity, AlertTriangle, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (content: string, filename: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        onFileSelect(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  return (
    <NeoCard title="ACTIVITY UPLOAD" color="#FFFFFF">
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-black bg-gray-50 text-center">
        <div className="w-16 h-16 bg-[#5454FF] rounded-full flex items-center justify-center mb-4 border-4 border-black shadow-neo-sm">
          <Activity className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl font-black mb-2">DATA IMPORT</h3>
        <p className="text-sm font-bold text-gray-500 mb-6 max-w-sm">
          Upload a .gpx file (Strava) or .csv (RingConn) to analyze data.
        </p>

        <label className="cursor-pointer">
          <input
            type="file"
            accept=".gpx,.xml,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-2 bg-[#5454FF] text-white border-4 border-black px-6 py-3 font-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
            <Upload className="w-5 h-5" /> SELECT FILE
          </div>
        </label>

        <div className="mt-8 text-xs text-left w-full max-w-md bg-white border-2 border-black p-3 shadow-neo-sm">
          <p className="font-bold mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> SUPPORTED FORMATS:</p>
          <p>• Strava/Garmin GPX</p>
          <p>• RingConn Export CSV (Activity, Sleep, Heart Rate)</p>
        </div>
      </div>
    </NeoCard>
  );
};

export default FileUpload;