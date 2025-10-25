import type { InstagramPreset, Settings } from './types';

export const INSTAGRAM_PRESETS: Record<string, InstagramPreset> = {
  'Square': { name: 'Square', aspectRatio: 1 / 1, width: 1080, height: 1080 },
  'Portrait': { name: 'Portrait', aspectRatio: 4 / 5, width: 1080, height: 1350 },
  'Landscape': { name: 'Landscape', aspectRatio: 1.91 / 1, width: 1080, height: 566 },
};

export const FONT_FACES = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Calibri'];

export const DEFAULT_SETTINGS: Settings = {
  presetName: 'Square',
  marginSize: 10, // percentage
  marginColor: '#FFFFFF',
  showExif: true,
  location: '...',
  textColor: '#000000',
  fontSize: 14,
  fontFamily: 'Arial',
  subjectText: '',
};
