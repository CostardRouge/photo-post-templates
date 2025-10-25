import React from 'react';
import type { Settings, Transform } from '../types';
import { INSTAGRAM_PRESETS, FONT_FACES } from '../constants';
import { DownloadIcon } from './icons';

interface ConfigurationPanelProps {
  settings: Settings;
  transform: Transform;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  onTransformChange: (newTransform: Partial<Transform>) => void;
  onResetTransform: () => void;
  onDownload: () => void;
  onDetectSubject: () => void;
  isImageLoaded: boolean;
  isDetecting: boolean;
  isCropping: boolean;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ 
  settings, 
  transform,
  onSettingsChange, 
  onTransformChange,
  onResetTransform,
  onDownload, 
  onDetectSubject,
  isImageLoaded,
  isDetecting,
  isCropping
}) => {
  const handleInputChange = <K extends keyof Settings,>(key: K, value: Settings[K]) => {
    onSettingsChange({ [key]: value });
  };
  
  return (
    <div className="p-6 bg-gray-800 h-full overflow-y-auto">
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Layout Studio</h2>
        
        {/* Presets */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Preset</label>
          <select
            value={settings.presetName}
            onChange={(e) => handleInputChange('presetName', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
          >
            {Object.keys(INSTAGRAM_PRESETS).map(name => (
              <option key={name} value={name}>{name} ({INSTAGRAM_PRESETS[name].width}x{INSTAGRAM_PRESETS[name].height})</option>
            ))}
          </select>
        </div>

        {/* Margin */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Margin Size ({settings.marginSize}%)</label>
          <input
            type="range" min="0" max="25" value={settings.marginSize}
            onChange={(e) => handleInputChange('marginSize', parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Margin Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color" value={settings.marginColor}
              onChange={(e) => handleInputChange('marginColor', e.target.value)}
              className="p-0 h-10 w-10 block bg-gray-700 border-gray-600 cursor-pointer rounded-lg"
            />
            <input
              type="text" value={settings.marginColor.toUpperCase()}
              onChange={(e) => handleInputChange('marginColor', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="border-t border-gray-700"></div>

        {/* Transform */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transform</h3>
            <p className="text-xs text-gray-400 -mt-3">Click and drag on the image to crop.</p>
             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Zoom ({transform.zoom.toFixed(2)}x)</label>
                <input
                    type="range" min="1" max="5" step="0.05" value={transform.zoom}
                    onChange={(e) => onTransformChange({ zoom: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            <button onClick={onResetTransform} className="w-full text-sm py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors">Reset Crop & Zoom</button>
        </div>
        
        <div className="border-t border-gray-700"></div>

        {/* EXIF Details */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Show EXIF Details</span>
          <button
            onClick={() => handleInputChange('showExif', !settings.showExif)}
            className={`${settings.showExif ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800`}
          >
            <span className={`${settings.showExif ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
          </button>
        </div>

        {settings.showExif && (
          <div className="space-y-4 pl-4 border-l-2 border-gray-700">
             <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Location Name</label>
              <input type="text" value={settings.location} onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Sunset Cliffs"
              />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Font</label>
                <select value={settings.fontFamily} onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {FONT_FACES.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Text Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.textColor} onChange={(e) => handleInputChange('textColor', e.target.value)} className="p-0 h-10 w-10 block bg-gray-700 border-gray-600 cursor-pointer rounded-lg"/>
                <input type="text" value={settings.textColor.toUpperCase()} onChange={(e) => handleInputChange('textColor', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Font Size ({settings.fontSize}px)</label>
              <input type="range" min="8" max="48" value={settings.fontSize} onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
        )}

        <div className="border-t border-gray-700"></div>
        
        {/* Subject Effect */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subject Effect</h3>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Subject Text</label>
                <p className="text-xs text-gray-400 -mt-2">Text will appear underneath the detected subject.</p>
                <input type="text" value={settings.subjectText} onChange={(e) => handleInputChange('subjectText', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="Your text here..."
                />
            </div>
            <button onClick={onDetectSubject} disabled={!isImageLoaded || isDetecting || isCropping}
                className="w-full flex justify-center py-2 px-4 rounded-md bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isDetecting ? (
                    <>
                        <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white mr-2"></div>
                        Detecting...
                    </>
                ) : 'Detect Main Subject'}
            </button>
        </div>


        {/* Download */}
        <div className="pt-6">
          <button
              onClick={onDownload}
              disabled={!isImageLoaded || isDetecting || isCropping}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
              <DownloadIcon />
              Download Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
