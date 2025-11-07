import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';

interface ImageEditorProps {
  originalImage: string;
  originalMimeType: string;
  editedImage: string | null;
  onEdit: (prompt: string) => Promise<void>;
  onBack: () => void; // Changed from onReset to onBack
  isLoading: boolean;
  error: string | null;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  originalImage,
  originalMimeType,
  editedImage,
  onEdit,
  onBack, // Use onBack
  isLoading,
  error,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const handleEdit = async () => {
    if (prompt.trim()) {
      await onEdit(prompt);
      setPrompt(''); // Clear prompt after sending
    }
  };

  useEffect(() => {
    if (!isLoading && promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [isLoading]);

  const currentEditedImage = editedImage || originalImage;
  const currentImageSrc = currentEditedImage ? `data:${originalMimeType};base64,${currentEditedImage}` : '';
  const originalImageSrc = originalImage ? `data:${originalMimeType};base64,${originalImage}` : '';

  return (
    <div className="flex flex-col w-full h-full p-4 md:p-6 bg-white rounded-lg shadow-xl overflow-hidden">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">AI Image Refinement</h2>

      {/* Image Display Area */}
      <div className="flex flex-col md:flex-row flex-grow min-h-[300px] mb-6 gap-4">
        {originalImage && (
          <div className="flex-1 min-h-[200px] bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden relative shadow-inner">
            <img
              src={originalImageSrc}
              alt="Original"
              className="max-w-full max-h-full object-contain"
            />
            <span className="absolute bottom-2 left-2 px-3 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full">Original</span>
          </div>
        )}
        <div className="flex-1 min-h-[200px] bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden relative shadow-inner">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-10 w-10 text-green-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 font-medium">Applying AI magic...</p>
            </div>
          ) : currentEditedImage ? (
            <>
              <img
                src={currentImageSrc}
                alt="Edited"
                className="max-w-full max-h-full object-contain"
              />
              <span className="absolute bottom-2 left-2 px-3 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full">Edited</span>
            </>
          ) : (
            <p className="text-gray-500 italic">Your edited image will appear here.</p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {/* Prompt Input */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 sticky bottom-0 bg-white pt-4 -mx-4 px-4 border-t border-gray-200 shadow-lg md:shadow-none md:border-t-0 md:pt-0 md:relative">
        <textarea
          ref={promptInputRef}
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none md:h-24 h-20 text-gray-700"
          placeholder="e.g., 'Add a retro filter', 'Remove the person in the background', 'Make it look luxury on a wood surface'..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          disabled={isLoading}
        ></textarea>
        <div className="flex flex-col md:flex-col gap-3">
          <Button onClick={handleEdit} disabled={isLoading || !prompt.trim()} fullWidth>
            {isLoading ? 'Processing...' : 'Apply Edit'}
          </Button>
          <Button onClick={onBack} variant="secondary" disabled={isLoading} fullWidth>
            Back to Select Image
          </Button>
        </div>
      </div>

      {/* Suggested Prompts (for mobile or inspiration) */}
      <div className="flex flex-wrap gap-2 justify-center mt-2 pb-4">
        {['Add a retro filter', 'Remove the background', 'Make it look luxury', 'Put it on a minimalist white surface', 'Enhance colors', 'Make it brighter'].map((suggestion) => (
          <span
            key={suggestion}
            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={() => setPrompt(suggestion)}
          >
            {suggestion}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ImageEditor;