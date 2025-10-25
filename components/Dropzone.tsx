
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileAccepted }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileAccepted(e.dataTransfer.files[0]);
    }
  }, [onFileAccepted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileAccepted(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <label
        htmlFor="file-upload"
        className={`relative flex flex-col items-center justify-center w-full h-full max-w-lg max-h-96 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragActive ? 'border-indigo-500 bg-gray-800' : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadIcon />
          <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-gray-500">PNG, JPG, or WEBP</p>
        </div>
        <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleChange} />
      </label>
    </div>
  );
};

export default Dropzone;
