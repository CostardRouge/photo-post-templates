import React, { useRef, useEffect, useState } from 'react';
import type { Settings, ExifData, Transform, Subject, CropRect } from '../types';
import { INSTAGRAM_PRESETS } from '../constants';

interface CanvasPreviewProps {
  imageSrc: string | null;
  settings: Settings;
  exifData: ExifData | null;
  transform: Transform;
  subject: Subject;
  onTransformChange: (newTransform: Partial<Transform>) => void;
  onSetCropping: (isCropping: boolean) => void;
}

const formatExposureTime = (exposureTime?: number): string => {
  if (exposureTime === undefined) return '';
  if (exposureTime < 1) {
    const reciprocal = 1 / exposureTime;
    if (reciprocal > 1000) return `1/${Math.round(reciprocal / 100) * 100}s`;
    if (reciprocal > 100) return `1/${Math.round(reciprocal / 10) * 10}s`;
    return `1/${Math.round(reciprocal)}s`;
  }
  return `${exposureTime}s`;
};

// Helper to convert mouse event coords to canvas-relative coords
const getCanvasCoords = (canvas: HTMLCanvasElement, event: React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
    };
};

const CanvasPreview: React.FC<CanvasPreviewProps> = ({ imageSrc, settings, exifData, transform, subject, onTransformChange, onSetCropping }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const subjectMaskRef = useRef<HTMLImageElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number; y: number} | null>(null);
  const [currentCropRect, setCurrentCropRect] = useState<CropRect | null>(null);

  useEffect(() => {
    if (subject.maskDataUrl) {
        const maskImg = new Image();
        maskImg.src = subject.maskDataUrl;
        maskImg.onload = () => {
            subjectMaskRef.current = maskImg;
            // Force redraw when mask is loaded
            drawCanvas();
        };
    } else {
        subjectMaskRef.current = null;
    }
  }, [subject.maskDataUrl]);
  
  // Debounce transform changes to avoid excessive re-renders
  const debouncedTransformChange = useRef(
    debounce((newTransform: Partial<Transform>) => {
      onTransformChange(newTransform);
    }, 50)
  ).current;

  const drawCanvas = () => {
    if (!imageRef.current || !canvasRef.current) return;
    
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Setup canvas
    const preset = INSTAGRAM_PRESETS[settings.presetName];
    canvas.width = preset.width;
    canvas.height = preset.height;

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw background
    ctx.fillStyle = settings.marginColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate image draw area
    const marginPx = Math.min(canvas.width, canvas.height) * (settings.marginSize / 100);
    const innerRect = {
      x: marginPx,
      y: marginPx,
      width: canvas.width - 2 * marginPx,
      height: canvas.height - 2 * marginPx,
    };
    if (innerRect.width <= 0 || innerRect.height <= 0) return;

    // Calculate source rect from original image based on crop
    const sourceRect = {
        sx: img.width * transform.crop.x,
        sy: img.height * transform.crop.y,
        sWidth: img.width * transform.crop.width,
        sHeight: img.height * transform.crop.height,
    };

    // Calculate destination rect based on zoom and aspect ratio
    const croppedAspectRatio = sourceRect.sWidth / sourceRect.sHeight;
    const innerAspectRatio = innerRect.width / innerRect.height;

    let destRect = { dx: 0, dy: 0, dWidth: 0, dHeight: 0 };
    if (croppedAspectRatio > innerAspectRatio) {
      destRect.dWidth = innerRect.width;
      destRect.dHeight = innerRect.width / croppedAspectRatio;
    } else {
      destRect.dHeight = innerRect.height;
      destRect.dWidth = innerRect.height * croppedAspectRatio;
    }

    // Apply zoom
    const zoomedWidth = destRect.dWidth * transform.zoom;
    const zoomedHeight = destRect.dHeight * transform.zoom;
    destRect.dx = innerRect.x + (innerRect.width - zoomedWidth) / 2;
    destRect.dy = innerRect.y + (innerRect.height - zoomedHeight) / 2;
    destRect.dWidth = zoomedWidth;
    destRect.dHeight = zoomedHeight;
    
    // Draw main image
    ctx.drawImage(img, sourceRect.sx, sourceRect.sy, sourceRect.sWidth, sourceRect.sHeight, destRect.dx, destRect.dy, destRect.dWidth, destRect.dHeight);
    
    // --- SUBJECT EFFECT ---
    if (subjectMaskRef.current && settings.subjectText) {
        // 1. Draw text
        ctx.fillStyle = settings.textColor;
        ctx.font = `bold ${settings.fontSize * 2}px ${settings.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(settings.subjectText, canvas.width / 2, canvas.height / 2);

        // 2. Prepare offscreen canvas with feathered subject
        if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement('canvas');
        }
        const offscreenCanvas = offscreenCanvasRef.current;
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        if (offscreenCtx) {
            offscreenCtx.clearRect(0, 0, canvas.width, canvas.height);
            // Draw original image part
            offscreenCtx.drawImage(img, sourceRect.sx, sourceRect.sy, sourceRect.sWidth, sourceRect.sHeight, destRect.dx, destRect.dy, destRect.dWidth, destRect.dHeight);
            // Use mask to clip it
            offscreenCtx.globalCompositeOperation = 'destination-in';
            offscreenCtx.drawImage(subjectMaskRef.current, destRect.dx, destRect.dy, destRect.dWidth, destRect.dHeight);
            
            // 3. Draw feathered subject onto main canvas
            ctx.save();
            ctx.shadowColor = settings.marginColor;
            ctx.shadowBlur = 25;
            // Draw multiple times for a stronger glow effect
            ctx.drawImage(offscreenCanvas, 0, 0);
            ctx.drawImage(offscreenCanvas, 0, 0);
            ctx.restore();
        }
    }

    // --- EXIF DATA ---
    if (settings.showExif && exifData) {
      const exifLines: string[] = [];
      if (exifData.LensModel) exifLines.push(exifData.LensModel);
      const details = [
        exifData.FocalLength ? `${exifData.FocalLength}mm` : '',
        exifData.FNumber ? `f/${exifData.FNumber}` : '',
        exifData.ExposureTime ? formatExposureTime(exifData.ExposureTime) : '',
        exifData.ISOSpeedRatings ? `ISO ${exifData.ISOSpeedRatings}` : '',
      ].filter(Boolean);
      if (details.length > 0) exifLines.push(details.join(' '));
      if (settings.location && settings.location !== '...') exifLines.push(settings.location);

      ctx.fillStyle = settings.textColor;
      ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      const textPadding = marginPx * 0.25;
      for (let i = 0; i < exifLines.length; i++) {
        const line = exifLines[exifLines.length - 1 - i];
        const yPos = canvas.height - marginPx - textPadding - (i * (settings.fontSize * 1.3));
        ctx.fillText(line, canvas.width - marginPx - textPadding, yPos);
      }
    }
    
    // Draw crop rectangle overlay if dragging
    if (isDragging && currentCropRect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        const x = currentCropRect.x * canvas.width;
        const y = currentCropRect.y * canvas.height;
        const w = currentCropRect.width * canvas.width;
        const h = currentCropRect.height * canvas.height;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
    }
  };
  
  useEffect(() => {
    if (imageSrc) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
            imageRef.current = img;
            drawCanvas();
        };
    }
  }, [imageSrc]);

  useEffect(() => {
    drawCanvas();
  }, [settings, exifData, transform, isDragging, currentCropRect]);


  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    setIsDragging(true);
    onSetCropping(true);
    const coords = getCanvasCoords(canvasRef.current!, e);
    const normalizedCoords = { x: coords.x / canvasRef.current!.width, y: coords.y / canvasRef.current!.height };
    setDragStart(normalizedCoords);
    setCurrentCropRect({ ...normalizedCoords, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !canvasRef.current) return;
    const coords = getCanvasCoords(canvasRef.current, e);
    const normalizedCoords = { x: coords.x / canvasRef.current.width, y: coords.y / canvasRef.current.height };
    
    const x = Math.min(dragStart.x, normalizedCoords.x);
    const y = Math.min(dragStart.y, normalizedCoords.y);
    const width = Math.abs(dragStart.x - normalizedCoords.x);
    const height = Math.abs(dragStart.y - normalizedCoords.y);
    setCurrentCropRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDragging || !currentCropRect || !imageRef.current) return;
    setIsDragging(false);
    onSetCropping(false);
    
    if (currentCropRect.width > 0.01 && currentCropRect.height > 0.01) {
        // Convert canvas crop rect to image crop rect
        const canvas = canvasRef.current!;
        const img = imageRef.current;
        const marginPx = Math.min(canvas.width, canvas.height) * (settings.marginSize / 100);
        const innerWidth = canvas.width - 2 * marginPx;
        const innerHeight = canvas.height - 2 * marginPx;
        
        const currentImageCrop = transform.crop;
        
        // This is complex, for simplicity we'll just crop the entire image for now.
        // A more advanced implementation would map canvas crop to image crop.
        // For this version, the user crops the full view.
        
        const newCrop = {
          x: currentImageCrop.x + (currentCropRect.x * currentImageCrop.width),
          y: currentImageCrop.y + (currentCropRect.y * currentImageCrop.height),
          width: currentImageCrop.width * currentCropRect.width,
          height: currentImageCrop.height * currentCropRect.height
        };
        
        // For simplicity, we'll map the crop on the canvas directly to the image
        // This isn't perfect if zoomed, but is a good starting point.
        // Let's make the crop relative to the current view.
        const sourceRect = {
            sx: img.width * transform.crop.x,
            sy: img.height * transform.crop.y,
            sWidth: img.width * transform.crop.width,
            sHeight: img.height * transform.crop.height,
        };

        const finalCrop = {
            x: sourceRect.sx + (currentCropRect.x * sourceRect.sWidth),
            y: sourceRect.sy + (currentCropRect.y * sourceRect.sHeight),
            width: sourceRect.sWidth * currentCropRect.width,
            height: sourceRect.sHeight * currentCropRect.height,
        };

        // Normalize back
        debouncedTransformChange({
            crop: {
                x: finalCrop.x / img.width,
                y: finalCrop.y / img.height,
                width: finalCrop.width / img.width,
                height: finalCrop.height / img.height
            }
        });
    }

    setDragStart(null);
    setCurrentCropRect(null);
  };
  
  function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func(...args), waitFor);
    };
  }

  return (
    <div className="flex-grow flex items-center justify-center p-4 md:p-8 overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain shadow-2xl rounded-md bg-gray-700 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default CanvasPreview;
