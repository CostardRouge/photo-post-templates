export interface InstagramPreset {
  name: string;
  aspectRatio: number; // width / height
  width: number;
  height: number;
}

export interface Settings {
  presetName: string;
  marginSize: number;
  marginColor: string;
  showExif: boolean;
  location: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  subjectText: string;
}

export interface ExifData {
  Make?: string;
  Model?: string;
  ExposureTime?: number;
  FNumber?: number;
  ISOSpeedRatings?: number;
  LensModel?: string;
  FocalLength?: number;
  latitude?: number;
  longitude?: number;
}

export interface CropRect {
  x: number; // 0 to 1
  y: number; // 0 to 1
  width: number; // 0 to 1
  height: number; // 0 to 1
}

export interface Transform {
  crop: CropRect;
  zoom: number; // 1 to 3
}

export interface Subject {
  maskDataUrl: string | null;
}
