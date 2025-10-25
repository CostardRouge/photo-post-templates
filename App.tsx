import React, { useState, useCallback } from 'react';
import ConfigurationPanel from './components/ConfigurationPanel';
import CanvasPreview from './components/CanvasPreview';
import Dropzone from './components/Dropzone';
import type { Settings, ExifData, Transform, Subject } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { suggestLocation, detectMainSubject } from './services/geminiService';

declare global {
    interface Window {
      exifr: any;
    }
}

const DEFAULT_TRANSFORM: Transform = {
    crop: { x: 0, y: 0, width: 1, height: 1 },
    zoom: 1,
};

const App: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [exifData, setExifData] = useState<ExifData | null>(null);
    const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
    const [subject, setSubject] = useState<Subject>({ maskDataUrl: null });
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isDetecting, setIsDetecting] = useState<boolean>(false);
    const [isCropping, setIsCropping] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileAccepted = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError(null);
        setSubject({ maskDataUrl: null });
        setTransform(DEFAULT_TRANSFORM);
        
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }

        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));

        try {
            const parsedExif = await window.exifr.parse(file, true);
            setExifData(parsedExif || {});
            const location = await suggestLocation(file);
            setSettings(prev => ({ ...prev, location, subjectText: '' }));
        } catch (err) {
            console.error('Error processing file:', err);
            setError('Could not process image. It might not have EXIF data.');
            setExifData({});
            setSettings(prev => ({ ...prev, location: 'Unknown Location', subjectText: '' }));
        } finally {
            setIsProcessing(false);
        }
    }, [imageUrl]);

    const handleSettingsChange = useCallback((newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    const handleTransformChange = useCallback((newTransform: Partial<Transform>) => {
        setTransform(prev => ({ ...prev, ...newTransform }));
    }, []);
    
    const handleResetTransform = useCallback(() => {
        setTransform(DEFAULT_TRANSFORM);
    }, []);
    
    const handleDetectSubject = useCallback(async () => {
        if (!imageFile) return;
        setIsDetecting(true);
        setError(null);
        try {
            const maskDataUrl = await detectMainSubject(imageFile);
            if (maskDataUrl) {
                setSubject({ maskDataUrl });
            } else {
                setError("Could not detect a subject in the image.");
            }
        } catch (err) {
            console.error("Subject detection failed:", err);
            setError("Subject detection service failed. Please try again.");
        } finally {
            setIsDetecting(false);
        }
    }, [imageFile]);

    const handleDownload = useCallback(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `layout_${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col md:flex-row max-h-screen">
            <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-gray-800 shadow-xl overflow-y-auto">
                <ConfigurationPanel
                    settings={settings}
                    transform={transform}
                    onSettingsChange={handleSettingsChange}
                    onTransformChange={handleTransformChange}
                    onResetTransform={handleResetTransform}
                    onDownload={handleDownload}
                    onDetectSubject={handleDetectSubject}
                    isImageLoaded={!!imageFile}
                    isDetecting={isDetecting}
                    isCropping={isCropping}
                />
            </aside>

            <main className="flex-grow flex flex-col items-center justify-center relative bg-black/20 overflow-hidden">
                {!imageFile && <Dropzone onFileAccepted={handleFileAccepted} />}

                {isProcessing && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-10">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
                        <p className="mt-4 text-lg">Analyzing your masterpiece...</p>
                    </div>
                )}
                
                {error && (
                    <div className="absolute top-4 mx-4 bg-red-800 text-white p-3 rounded-md z-20 text-center">
                        {error}
                    </div>
                )}

                {imageUrl && (
                    <CanvasPreview
                        imageSrc={imageUrl}
                        settings={settings}
                        exifData={exifData}
                        transform={transform}
                        subject={subject}
                        onTransformChange={handleTransformChange}
                        onSetCropping={setIsCropping}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
