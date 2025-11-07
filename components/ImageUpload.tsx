import React, { useRef } from 'react';
import Button from './Button';
import { fileToBase64, isValidImageType } from '../utils/imageUtils';
import { FileSize } from '../types';

interface ImageUploadProps {
  onImageSelect: (base64: string, mimeType: string) => void;
  isLoading: boolean;
  setError: (message: string | null) => void;
  onSwitchToCamera?: () => void; // New prop for switching to camera
  hasCamera?: boolean; // New prop to indicate if camera is available
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, isLoading, setError, onSwitchToCamera, hasCamera }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (!isValidImageType(file)) {
        setError('Invalid file type. Please upload a JPG, PNG, or WebP image.');
        return;
      }
      try {
        const { base64, mimeType } = await fileToBase64(file);
        onImageSelect(base64, mimeType);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(`File upload error: ${e.message}`);
        } else {
          setError('An unknown error occurred during file upload.');
        }
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white shadow-lg rounded-xl w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload or Capture Image</h2>
      
      {hasCamera && onSwitchToCamera && (
        <div className="mb-6 w-full">
          <Button
            onClick={onSwitchToCamera}
            fullWidth
            variant="primary"
            disabled={isLoading}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          >
            Use Camera
          </Button>
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 hover:border-green-500 transition-colors duration-200 cursor-pointer w-full" onClick={!isLoading ? handleUploadClick : undefined}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        {isLoading ? (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-green-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Processing...</p>
          </div>
        ) : (
          <>
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <p className="mb-2 text-gray-600">
              Drag & drop an image here, or
            </p>
            <Button type="button" variant="secondary" className="mt-2 pointer-events-none">
              Browse Files
            </Button>
            <p className="mt-2 text-sm text-gray-500">
              (JPG, PNG, WEBP up to {FileSize.MAX_UPLOAD_MB}MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;