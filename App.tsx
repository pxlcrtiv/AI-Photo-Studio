import React, { useState, useCallback, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import ImageEditor from './components/ImageEditor';
import CameraCapture from './components/CameraCapture';
import { editImageWithPrompt } from './services/geminiService';
import { ImagePromptRequest } from './types';

type AppView = 'camera' | 'upload' | 'editor';

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalMimeType, setOriginalMimeType] = useState<string>('');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('upload'); // Default to upload
  const [hasCamera, setHasCamera] = useState<boolean | null>(null); // null means checking, true/false means result


  useEffect(() => {
    // Check for camera availability and permissions on mount
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoInputDevices.length > 0) {
          setHasCamera(true);
          // Try to get permission immediately to set initial view
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          stream.getTracks().forEach(track => track.stop()); // Stop stream immediately after checking
          setCurrentView('camera'); // If camera is available and permission granted, start with camera
        } else {
          setHasCamera(false);
          setCurrentView('upload');
        }
      } catch (e) {
        console.warn("Camera access denied or no camera found:", e);
        setHasCamera(false);
        setCurrentView('upload'); // Fallback to upload if permission denied or no camera
      }
    };
    checkCamera();
  }, []);

  const handleImageSelect = useCallback((base64: string, mimeType: string) => {
    setOriginalImage(base64);
    setOriginalMimeType(mimeType);
    setEditedImage(null); // Reset edited image when a new original is selected
    setError(null);
    setCurrentView('editor');
  }, []);

  const handleEdit = useCallback(async (prompt: string) => {
    setError(null);
    setIsLoading(true);

    if (!originalImage || !originalMimeType) {
      setError('No image selected for editing.');
      setIsLoading(false);
      return;
    }

    try {
      const request: ImagePromptRequest = {
        base64Image: editedImage || originalImage, // Use edited image if available, else original
        mimeType: originalMimeType,
        prompt: prompt,
      };
      const newEditedImageBase64 = await editImageWithPrompt(request);
      setEditedImage(newEditedImageBase64);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(`AI editing failed: ${e.message}`);
      } else {
        setError('An unexpected error occurred during AI editing.');
      }
      console.error('Editing error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, originalMimeType, editedImage]);

  const handleBackToSelection = useCallback(() => {
    setOriginalImage(null);
    setOriginalMimeType('');
    setEditedImage(null);
    setError(null);
    setCurrentView(hasCamera ? 'camera' : 'upload'); // Go back to camera if available, else upload
  }, [hasCamera]);

  const renderContent = () => {
    if (error && currentView !== 'editor') {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      );
    }

    switch (currentView) {
      case 'camera':
        return (
          <CameraCapture
            onImageCapture={handleImageSelect}
            onSwitchToUpload={() => setCurrentView('upload')}
            setError={setError}
          />
        );
      case 'upload':
        return (
          <ImageUpload
            onImageSelect={handleImageSelect}
            isLoading={isLoading}
            setError={setError}
            onSwitchToCamera={hasCamera ? () => setCurrentView('camera') : undefined}
            hasCamera={hasCamera === true}
          />
        );
      case 'editor':
        if (originalImage && originalMimeType) {
          return (
            <ImageEditor
              originalImage={originalImage}
              originalMimeType={originalMimeType}
              editedImage={editedImage}
              onEdit={handleEdit}
              onBack={handleBackToSelection}
              isLoading={isLoading}
              error={error}
            />
          );
        }
        // Fallback if editor view is somehow reached without an image
        return (
          <ImageUpload
            onImageSelect={handleImageSelect}
            isLoading={isLoading}
            setError={setError}
            onSwitchToCamera={hasCamera ? () => setCurrentView('camera') : undefined}
            hasCamera={hasCamera === true}
          />
        );
      default:
        // Show a loading indicator or initial screen while checking camera
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <svg className="animate-spin h-12 w-12 text-green-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl">Initializing...</p>
          </div>
        );
    }
  };

  // For camera view, we want full screen, so no outer padding/centering div
  if (currentView === 'camera') {
    return (
      <div className="app-container full-screen">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-gray-900">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-700 mb-2">
          📸 AI Photo Studio
        </h1>
        <p className="text-lg text-gray-600">
          Refine your product images with Gemini 2.5 Flash Image
        </p>
      </header>

      <main className="w-full max-w-5xl flex-grow flex items-center justify-center">
        {renderContent()}
      </main>

      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 AI Photo Studio. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
}

export default App;