'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { createWorker } from 'tesseract.js';
import { processScan, processStewardCheckIn, ScanResult, getCheckInStats, getCheckInStatistics, getVerifiedCheckIns, getRecentScans, deleteCheckIns, type CheckInStatistics, type VerifiedCheckIn, type RecentScan } from '@/app/actions/checkpoint-actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, X, Clock } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Web Audio API helper
const playBeep = (type: 'success' | 'error' | 'warning') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'success') {
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
  } else if (type === 'error') {
    osc.frequency.setValueAtTime(150, ctx.currentTime); // Low pitch
    osc.type = 'sawtooth';
  } else {
    // Warning
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.type = 'square';
  }
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export default function LiveCheckPointPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<RecentScan[]>([]);
  const [checkInCount, setCheckInCount] = useState(0);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'barcode' | 'ocr'>('barcode');
  const [manualSiaInput, setManualSiaInput] = useState('');
  const [stewardName, setStewardName] = useState('');
  const [stewardProvider, setStewardProvider] = useState('');
  const [statistics, setStatistics] = useState<CheckInStatistics | null>(null);
  const [verifiedCheckIns, setVerifiedCheckIns] = useState<VerifiedCheckIn[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set());
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  
  // Check browser on mount
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isChrome = userAgent.indexOf("Chrome") > -1;
    const isEdge = userAgent.indexOf("Edg") > -1;
    const isOpera = userAgent.indexOf("OPR") > -1;
    
    // Check if it's pure Chrome (not Edge, Opera, etc.)
    // Note: This is a basic check. Some mobile browsers might identify differently.
    // The goal is to warn users who might have issues with camera access (like Safari/Firefox)
    const isPureChrome = isChrome && !isEdge && !isOpera;
    
    if (!isPureChrome) {
      setShowBrowserWarning(true);
    }
  }, []);
  
  // Scanner Refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ocrWorkerRef = useRef<any>(null);
  const { toast } = useToast();

  // Extract SIA number from text (format: XXXX XXXX XXXX XXXX or similar)
  const extractSiaNumber = (text: string): string | null => {
    if (!text) return null;
    
    // Clean the text - remove common OCR errors
    let cleaned = text
      .replace(/[Oo]/g, '0')  // Replace O with 0
      .replace(/[Il]/g, '1')  // Replace I/l with 1
      .replace(/[S]/g, '5')  // Replace S with 5 (common OCR error)
      .replace(/[Z]/g, '2')  // Replace Z with 2
      .replace(/[B]/g, '8')  // Replace B with 8
      .replace(/[G]/g, '6'); // Replace G with 6
    
    // First, try to find 16-digit numbers (SIA license numbers are typically 16 digits)
    // Pattern: 4 groups of 4 digits with optional spaces/dashes
    const siaPattern16 = /(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})/;
    const match16 = cleaned.match(siaPattern16);
    if (match16) {
      const number = match16[0].replace(/[\s-]/g, '');
      if (number.length === 16) {
        console.log('Found SIA number (16 digits):', number);
        return number;
      }
    }
    
    // Try to find any sequence of 12-16 consecutive digits (in case of OCR errors)
    const longNumberPattern = /\d{12,16}/;
    const longMatch = cleaned.match(longNumberPattern);
    if (longMatch) {
      const number = longMatch[0];
      // Prefer 16 digits, but accept 12-16
      if (number.length >= 12) {
        console.log('Found SIA number (12-16 digits):', number);
        return number;
      }
    }
    
    // Try flexible pattern with groups (handles OCR spacing errors)
    const flexiblePattern = /(\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4})/;
    const flexMatch = cleaned.match(flexiblePattern);
    if (flexMatch) {
      const number = flexMatch[0].replace(/[\s-]/g, '');
      if (number.length >= 12 && number.length <= 16) {
        console.log('Found SIA number (flexible pattern):', number);
        return number;
      }
    }
    
    // Last resort: find the longest sequence of digits (at least 10 digits)
    const allDigits = cleaned.match(/\d+/g);
    if (allDigits && allDigits.length > 0) {
      // Find the longest digit sequence
      const longest = allDigits.reduce((a, b) => a.length > b.length ? a : b);
      if (longest.length >= 10) {
        console.log('Found potential SIA number (longest sequence):', longest);
        return longest;
      }
    }
    
    console.log('No SIA number found in text:', text);
    return null;
  };

  // OCR function to read text from canvas
  const performOCR = async (canvas: HTMLCanvasElement): Promise<string | null> => {
    if (!ocrWorkerRef.current) {
      console.log('Initializing OCR worker...');
      ocrWorkerRef.current = await createWorker('eng', 1, {
        logger: (m: any) => {
          // Suppress verbose OCR logs
          if (m.status === 'recognizing text') {
            return;
          }
        }
      });
      
      // Set parameters that can only be set during initialization
      await ocrWorkerRef.current.setParameters({
        tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine only - must be set at init
      });
      
      console.log('OCR worker initialized');
    }
    
    try {
      // Configure OCR for better number recognition - set parameters before each recognition
      await ocrWorkerRef.current.setParameters({
        tessedit_char_whitelist: '0123456789 ', // Only allow digits and spaces
        tessedit_pageseg_mode: '7', // Treat image as single text line
      });
      
      // Convert canvas to data URL with high quality
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      
      // Use recognize with custom options for better number detection
      const { data: { text } } = await ocrWorkerRef.current.recognize(dataUrl, {
        rectangle: { top: 0, left: 0, width: canvas.width, height: canvas.height }
      });
      
      console.log('OCR text:', text);
      return text;
    } catch (error) {
      console.error('OCR error:', error);
      return null;
    }
  };

  // Handle delete selected scans
  const handleDeleteScans = async () => {
    if (selectedScans.size === 0) return;

    try {
      const idsToDelete = Array.from(selectedScans);
      await deleteCheckIns(idsToDelete);
      
      // Reload statistics and recent scans
      const [count, stats, verified, recent] = await Promise.all([
        getCheckInStats(id),
        getCheckInStatistics(id),
        getVerifiedCheckIns(id),
        getRecentScans(id, 10)
      ]);
      setCheckInCount(count);
      setStatistics(stats);
      setVerifiedCheckIns(verified);
      setScanHistory(recent);
      
      // Exit edit mode and clear selection
      setIsEditMode(false);
      setSelectedScans(new Set());
      
      toast({
        title: "Deleted",
        description: `Deleted ${idsToDelete.length} scan(s)`,
      });
    } catch (error) {
      console.error('Error deleting scans:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete scans",
        variant: "destructive"
      });
    }
  };

  // Toggle scan selection
  const toggleScanSelection = (scanId: string) => {
    setSelectedScans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scanId)) {
        newSet.delete(scanId);
      } else {
        newSet.add(scanId);
      }
      return newSet;
    });
  };

  // Handle steward check-in
  const handleStewardCheckIn = async () => {
    if (!stewardName.trim() || !stewardProvider.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both name and provider",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save steward to database via server action
      const result = await processStewardCheckIn(id, stewardName.trim(), stewardProvider.trim());
      
      // Add to history immediately
      setLastScan(result);
      
      // Reload statistics, verified check-ins, and recent scans from database
      const [count, stats, verified, recent] = await Promise.all([
        getCheckInStats(id),
        getCheckInStatistics(id),
        getVerifiedCheckIns(id),
        getRecentScans(id, 10)
      ]);
      setCheckInCount(count);
      setStatistics(stats);
      setVerifiedCheckIns(verified);
      setScanHistory(recent);

      // Clear form
      setStewardName('');
      setStewardProvider('');

      // Audio feedback
      playBeep('success');
    } catch (error) {
      console.error('Error checking in steward:', error);
      toast({
        title: "Check-In Error",
        description: "Failed to check in steward",
        variant: "destructive"
      });
      playBeep('error');
    }
  };

  // Handle SIA number processing (used by both barcode and OCR)
  const handleSiaNumber = async (siaNumber: string, source: 'barcode' | 'ocr' | 'manual') => {
    console.log(`Processing SIA number from ${source}:`, siaNumber);
    
    // Stop scanning to prevent double-reads while processing
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        isScanningRef.current = false;
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }

    try {
      // Call Server Action with the SIA number
      // Map source to method for processScan
      const method = source === 'barcode' ? 'qr_scan' : source === 'ocr' ? 'ocr_scan' : 'manual_entry';
      const result = await processScan(id, siaNumber, method);
      console.log('Scan result:', result);
      
      // Always add to history, regardless of verification status
      setLastScan(result);
      
      // Reload statistics, verified check-ins, and recent scans from database
      // This ensures we always have the latest data from the database
      const [count, stats, verified, recent] = await Promise.all([
        getCheckInStats(id),
        getCheckInStatistics(id),
        getVerifiedCheckIns(id),
        getRecentScans(id, 10)
      ]);
      setCheckInCount(count);
      setStatistics(stats);
      setVerifiedCheckIns(verified);
      setScanHistory(recent); // Always use database data to ensure persistence

      // Audio Feedback
      if (result.status === 'verified') playBeep('success');
      else if (result.status === 'duplicate') playBeep('warning');
      else playBeep('error');

    } catch (e) {
      console.error('Error processing scan:', e);
      toast({ title: "Scan Error", variant: "destructive" });
      playBeep('error');
      
      // Still add error to history
      const errorResult: RecentScan = {
        id: `error-${Date.now()}`, // Generate a temporary ID for error
        success: false,
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Error processing scan: ' + (e instanceof Error ? e.message : 'Unknown error')
      };
      setLastScan(errorResult);
      setScanHistory(prev => [errorResult, ...prev].slice(0, 10));
    } finally {
      // Resume scanning after 2 seconds delay
      setTimeout(async () => {
        if (scannerRef.current && id) {
          try {
            let cameras: any[] = [];
            try {
              cameras = await Html5Qrcode.getCameras();
            } catch (err) {
              console.error('Error getting cameras on resume:', err);
              return;
            }
            
            if (cameras.length > 0 && !isScanningRef.current) {
              await scannerRef.current.start(
                cameras[0].id,
                {
                  fps: 10,
                  qrbox: undefined, // Scan entire viewport for easier scanning
                  aspectRatio: 1.777778,
                  disableFlip: false,
                  videoConstraints: {
                    facingMode: "environment"
                  }
                },
                onScanSuccess,
                (errorMessage) => {
                  if (errorMessage && 
                      !errorMessage.includes('No QR code found') && 
                      !errorMessage.includes('NotFoundException') &&
                      !errorMessage.includes('No MultiFormat Readers') &&
                      !errorMessage.includes('No barcode found') &&
                      !errorMessage.includes('QR code parse error')) {
                    console.log('Scan error (ignored):', errorMessage);
                  }
                }
              );
              isScanningRef.current = true;
              
              // Restart OCR scanning
              setTimeout(() => {
                const readerElement = document.getElementById("reader");
                if (readerElement) {
                  const video = readerElement.querySelector('video') as HTMLVideoElement;
                  if (video) {
                    videoRef.current = video;
                    startOCRScanning(video);
                  }
                }
              }, 1000);
            }
          } catch (e) {
            console.error('Error resuming scanner:', e);
          }
        }
      }, 2000);
    }
  };

  // OCR scanning function
  const startOCRScanning = (video: HTMLVideoElement) => {
    console.log('Starting OCR scanning...');
    
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvasRef.current = canvas;
    }

    let lastOcrTime = 0;
    const ocrInterval = 3000; // Run OCR every 3 seconds (slower to reduce load)

    const performOCRScan = async () => {
      if (!video || !canvasRef.current || !isScanningRef.current) {
        console.log('OCR scan skipped: conditions not met');
        return;
      }
      
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.log('OCR scan skipped: video not ready');
        return;
      }
      
      const now = Date.now();
      if (now - lastOcrTime < ocrInterval) return;
      lastOcrTime = now;

      try {
        console.log('Performing OCR scan...');
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.log('OCR scan skipped: no canvas context');
          return;
        }

        // Get video dimensions
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const clientWidth = video.clientWidth;
        const clientHeight = video.clientHeight;
        
        // Calculate scale factors between video resolution and displayed size
        // The viewfinder (what user sees) uses clientWidth/clientHeight
        // The actual video uses videoWidth/videoHeight
        const scaleX = videoWidth / clientWidth;
        const scaleY = videoHeight / clientHeight;
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Draw the full video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Calculate guide area based on CLIENT dimensions (what the overlay is positioned on)
        // Guide overlay is positioned at: top 32%, left 5%, width 90%, height 25% of the DISPLAYED view
        // Fine-tuned to match actual scanning area
        const guideClientX = clientWidth * 0.05;
        const guideClientY = clientHeight * 0.32;
        const guideClientWidth = clientWidth * 0.90;
        const guideClientHeight = clientHeight * 0.25;
        
        // Scale to video coordinates to match what we actually captured
        const guideX = Math.floor(guideClientX * scaleX);
        const guideY = Math.floor(guideClientY * scaleY);
        const guideWidth = Math.floor(guideClientWidth * scaleX);
        const guideHeight = Math.floor(guideClientHeight * scaleY);
        
        console.log('OCR crop coordinates:', { 
          guideX, 
          guideY, 
          guideWidth, 
          guideHeight, 
          videoWidth,
          videoHeight,
          clientWidth,
          clientHeight,
          scaleX,
          scaleY,
          guideClientX,
          guideClientY,
          guideClientWidth,
          guideClientHeight
        });
        
        // Crop to the guide overlay area only
        const cropCanvas = document.createElement('canvas');
        // Scale up for better OCR accuracy (2x resolution)
        cropCanvas.width = guideWidth * 2;
        cropCanvas.height = guideHeight * 2;
        const cropCtx = cropCanvas.getContext('2d');
        
        let text: string | null = null;
        
        if (cropCtx) {
          // Use image smoothing for better quality
          cropCtx.imageSmoothingEnabled = true;
          cropCtx.imageSmoothingQuality = 'high';
          
          // Extract only the guide overlay area and scale up
          cropCtx.drawImage(
            canvas,
            guideX, guideY, guideWidth, guideHeight,  // Source: guide overlay area
            0, 0, cropCanvas.width, cropCanvas.height  // Destination: 2x scaled
          );
          
          // Enhance image for better OCR - focus on black text on blue background
          const imageData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
          const data = imageData.data;
          
          // First pass: identify blue background vs black text
          const blueThreshold = 0.4; // Blue channel should be higher for background
          const brightnessThreshold = 0.5; // Overall brightness threshold
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // Check if pixel is blue (background) or dark (text)
            const isBlue = b > (r + g) * blueThreshold && b > 0.3;
            const brightness = (r + g + b) / 3;
            const isDark = brightness < brightnessThreshold;
            
            let value: number;
            if (isDark && !isBlue) {
              // Dark pixels that aren't blue = black text - make pure black
              value = 0;
            } else if (isBlue || brightness > 0.4) {
              // Blue background or light areas - make white
              value = 255;
            } else {
              // Edge cases - use threshold
              value = brightness < 0.3 ? 0 : 255;
            }
            
            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
            // data[i + 3] stays as alpha
          }
          cropCtx.putImageData(imageData, 0, 0);
          
          // Apply additional sharpening for better number recognition
          const sharpenData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
          const sharpenPixels = sharpenData.data;
          const tempData = new Uint8ClampedArray(sharpenPixels);
          
          // Simple sharpening kernel
          for (let y = 1; y < cropCanvas.height - 1; y++) {
            for (let x = 1; x < cropCanvas.width - 1; x++) {
              const idx = (y * cropCanvas.width + x) * 4;
              const center = tempData[idx];
              const top = tempData[((y - 1) * cropCanvas.width + x) * 4];
              const bottom = tempData[((y + 1) * cropCanvas.width + x) * 4];
              const left = tempData[(y * cropCanvas.width + (x - 1)) * 4];
              const right = tempData[(y * cropCanvas.width + (x + 1)) * 4];
              
              // Sharpening: center * 5 - neighbors
              const sharpened = Math.max(0, Math.min(255, center * 5 - (top + bottom + left + right)));
              sharpenPixels[idx] = sharpened;
              sharpenPixels[idx + 1] = sharpened;
              sharpenPixels[idx + 2] = sharpened;
            }
          }
          cropCtx.putImageData(sharpenData, 0, 0);
          
          // Pass cropped and enhanced canvas to OCR
          text = await performOCR(cropCanvas);
        } else {
          // Fallback to full canvas if crop fails
          text = await performOCR(canvas);
        }
        
        if (text) {
          console.log('OCR extracted text:', text);
          const siaNumber = extractSiaNumber(text);
          if (siaNumber && siaNumber.length >= 12) {
            console.log('SIA number found via OCR:', siaNumber);
            // Process the scan
            handleSiaNumber(siaNumber, 'ocr');
          } else {
            console.log('No valid SIA number found in OCR text');
          }
        } else {
          console.log('OCR returned no text');
        }
      } catch (error) {
        // Log OCR errors for debugging
        console.log('OCR attempt failed:', error);
      }
    };

    // Run OCR periodically
    const ocrIntervalId = setInterval(performOCRScan, ocrInterval);
    
    // Store interval ID for cleanup
    (video as any).ocrIntervalId = ocrIntervalId;
    console.log('OCR scanning started with interval:', ocrIntervalId);
  };

  async function onScanSuccess(decodedText: string, decodedResult: any) {
    console.log('Barcode scanned:', decodedText, decodedResult);
    
    // Extract SIA number from barcode
    // The barcode should contain the SIA number directly
    let siaNumber = decodedText.trim();
    
    // Remove any non-digit characters (barcodes might have prefixes/suffixes)
    const digitsOnly = siaNumber.replace(/\D/g, '');
    
    // If we have 12-16 digits, use that
    if (digitsOnly.length >= 12 && digitsOnly.length <= 16) {
      siaNumber = digitsOnly;
    } else {
      // Try to extract using the same pattern matching as OCR
      const extracted = extractSiaNumber(siaNumber);
      if (extracted) {
        siaNumber = extracted;
      }
    }
    
    if (siaNumber.length >= 12) {
      console.log('Processing barcode SIA number:', siaNumber);
      await handleSiaNumber(siaNumber, 'barcode');
    } else {
      console.warn('Barcode did not contain valid SIA number:', decodedText);
    }
  }

  useEffect(() => {
    if (!id) return;

    // Check if we're in a secure context (required for camera access)
    if (!window.isSecureContext) {
      const errorMsg = "Camera access requires HTTPS or localhost. Please use a secure connection.";
      setScannerError(errorMsg);
      toast({ 
        title: "Security Error", 
        description: errorMsg,
        variant: "destructive" 
      });
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(async () => {
      try {
        // Check if element exists
        const element = document.getElementById("reader");
        if (!element) {
          console.error("Scanner element not found");
          toast({ 
            title: "Scanner Error", 
            description: "Scanner element not found. Please refresh the page.",
            variant: "destructive" 
          });
          return;
        }

        // Initialize Scanner with barcode support
        scannerRef.current = new Html5Qrcode("reader", {
          verbose: false, // Reduce console noise - NotFoundException is normal
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Enable native BarcodeDetector API for better barcode scanning
          },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.ITF
          ]
        });

        // Get available cameras
        let cameras: any[] = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch (err) {
          console.error('Error getting cameras:', err);
          throw new Error("Failed to access cameras. Please check browser permissions.");
        }
        
        if (cameras.length === 0) {
          throw new Error("No cameras found. Please ensure a camera is connected and permissions are granted.");
        }

        // Start with the first available camera (usually the default)
        const cameraId = cameras[0].id;
        
        // Try using native BarcodeDetector API if available (better for barcodes)
        const useNativeBarcodeDetector = 'BarcodeDetector' in window;
        console.log('Native BarcodeDetector available:', useNativeBarcodeDetector);

        await scannerRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              // Match the visual guide overlay exactly:
              // Top: 32%, Left: 5%, Width: 90%, Height: 25%
              // Fine-tuned to match actual scanning area
              const x = Math.floor(viewfinderWidth * 0.05);
              const y = Math.floor(viewfinderHeight * 0.32);
              const width = Math.floor(viewfinderWidth * 0.90);
              const height = Math.floor(viewfinderHeight * 0.25);
              
              console.log('QR Box coordinates:', { x, y, width, height, viewfinderWidth, viewfinderHeight });
              
              return {
                width: width,
                height: height,
                x: x,
                y: y
              };
            },
            aspectRatio: 1.777778, // 16:9 aspect ratio better for barcodes
            disableFlip: false, // Allow flipping for barcode orientation
            videoConstraints: {
              facingMode: "environment" // Use back camera if available (better for scanning)
            },
            // Try to use native barcode detector if available
            ...(useNativeBarcodeDetector ? {
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
              }
            } : {})
          },
          onScanSuccess,
          (errorMessage) => {
            // Suppress NotFoundException errors - these are normal when scanning
            // The scanner continuously tries to decode and NotFoundException means no code found yet
            if (errorMessage) {
              if (errorMessage.includes('NotFoundException') || 
                  errorMessage.includes('No QR code found') ||
                  errorMessage.includes('No barcode found') ||
                  errorMessage.includes('QR code parse error')) {
                // These are normal - scanner is working, just no code in view
                return;
              }
              // Only log unexpected errors
              if (!errorMessage.includes('NotFoundException')) {
                console.warn('Scanner error:', errorMessage);
              }
            }
          }
        );
        
        isScanningRef.current = true;
        setIsScannerReady(true);
        setScannerError(null);

        // Set up OCR scanning as fallback/alternative
        setTimeout(() => {
          const readerElement = document.getElementById("reader");
          if (readerElement) {
            const video = readerElement.querySelector('video') as HTMLVideoElement;
            if (video) {
              console.log('Video element found, starting OCR:', video);
              videoRef.current = video;
              
              // Log video dimensions for debugging
              video.addEventListener('loadedmetadata', () => {
                console.log('Video metadata loaded:', {
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight,
                  clientWidth: video.clientWidth,
                  clientHeight: video.clientHeight
                });
                startOCRScanning(video);
              }, { once: true });
              
              // Also try immediately in case it's already loaded
              if (video.readyState >= 2) {
                console.log('Video already loaded:', {
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight,
                  clientWidth: video.clientWidth,
                  clientHeight: video.clientHeight
                });
                startOCRScanning(video);
              }
            } else {
              console.log('Video element not found in reader');
            }
          } else {
            console.log('Reader element not found');
          }
        }, 2000);
      } catch (error: any) {
        console.error('Error initializing scanner:', error);
        const errorMsg = error.message || "Failed to initialize camera. Please check browser permissions and ensure you're using HTTPS or localhost.";
        setScannerError(errorMsg);
        setIsScannerReady(false);
        toast({ 
          title: "Camera Error", 
          description: errorMsg,
          variant: "destructive" 
        });
      }
    }, 100);
    
    // Initial stats load
    const loadStats = async () => {
      try {
        const [count, stats, verified, recent] = await Promise.all([
          getCheckInStats(id),
          getCheckInStatistics(id),
          getVerifiedCheckIns(id),
          getRecentScans(id, 10)
        ]);
        setCheckInCount(count);
        setStatistics(stats);
        setVerifiedCheckIns(verified);
        setScanHistory(recent); // Load recent scans from database
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    loadStats();

    return () => {
      clearTimeout(timer);
      const cleanup = async () => {
        // Stop OCR scanning
        if (videoRef.current && (videoRef.current as any).ocrIntervalId) {
          clearInterval((videoRef.current as any).ocrIntervalId);
        }
        
        // Terminate OCR worker
        if (ocrWorkerRef.current) {
          try {
            await ocrWorkerRef.current.terminate();
            ocrWorkerRef.current = null;
          } catch (err) {
            console.error('Error terminating OCR worker:', err);
          }
        }
        
        if (scannerRef.current && isScanningRef.current) {
          try {
            // Stop the scanner first
            await scannerRef.current.stop();
            isScanningRef.current = false;
          } catch (err) {
            console.error('Error stopping scanner during cleanup:', err);
            // Continue to clear even if stop fails
          }
        }
        
        // Now clear the scanner
        if (scannerRef.current) {
          try {
            await scannerRef.current.clear();
          } catch (err) {
            console.error('Error clearing scanner:', err);
          }
        }
      };
      
      cleanup();
    };
  }, [id, toast]);

  // Helper to render the result card
  const renderResultCard = () => {
    if (!lastScan) return <div className="text-center py-8 text-gray-500">Ready to Scan</div>;

    const isSteward = lastScan.siaNumber === 'STEWARD';
    const isSignOut = lastScan.isSignOut || lastScan.status === 'signed_out';
    
    const styles = {
      verified: { 
        bg: isSteward ? 'bg-yellow-100' : 'bg-green-100', 
        text: isSteward ? 'text-yellow-800' : 'text-green-800', 
        icon: isSteward ? <AlertTriangle className="h-12 w-12 text-yellow-600 mb-2" /> : <CheckCircle className="h-12 w-12 text-green-600 mb-2" />
      },
      signed_out: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <CheckCircle className="h-12 w-12 text-blue-600 mb-2" />
      },
      unlisted: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="h-12 w-12 text-red-600 mb-2" /> },
      duplicate: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <AlertTriangle className="h-12 w-12 text-amber-600 mb-2" /> },
      error: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <XCircle className="h-12 w-12 text-gray-600 mb-2" /> },
    };

    const style = styles[lastScan.status] || styles.error;

    // Render sign-out card
    if (isSignOut && lastScan.signInTime && lastScan.signOutTime) {
      return (
        <div className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 ${style.bg} animate-in zoom-in-50 duration-300`}>
          {style.icon}
          <h2 className={`text-2xl font-bold ${style.text} uppercase mb-6`}>
            SIGNED OUT
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Left Column: Staff Details */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-2">
              {lastScan.siaNumber && lastScan.siaNumber !== 'STEWARD' && (
                <p className="text-base font-mono font-bold bg-white/60 px-3 py-1 rounded border border-black/5 w-fit">
                  SIA: {lastScan.siaNumber}
                </p>
              )}
              
              <p className="text-2xl font-bold text-gray-900">{lastScan.staffName}</p>
              
              {lastScan.role && (
                <p className="text-sm font-semibold bg-white/60 px-3 py-1 rounded border border-black/5 w-fit">
                  {lastScan.role}
                </p>
              )}
              
              <p className="text-base font-medium opacity-80">{lastScan.providerName}</p>
              
              <div className="space-y-1 mt-1 text-right">
                <p className="text-sm font-medium bg-white/60 px-3 py-1 rounded border border-black/5 w-fit ml-auto">
                  Sign In: {new Date(lastScan.signInTime).toLocaleTimeString()}
                </p>
                <p className="text-sm font-medium bg-white/60 px-3 py-1 rounded border border-black/5 w-fit ml-auto">
                  Sign Out: {new Date(lastScan.signOutTime).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Right Column: Register Check */}
            <div className="flex flex-col justify-start h-full">
              {lastScan.registerCheck && lastScan.siaNumber && lastScan.siaNumber !== 'STEWARD' ? (
                <div className={`w-full rounded-lg border-2 p-4 h-full ${lastScan.registerCheck.found ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-3 border-b border-black/5 pb-2">
                    {lastScan.registerCheck.found ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-base font-bold text-green-700">Found in Register</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-base font-bold text-red-700">Not Found in Register</span>
                      </>
                    )}
                  </div>
                  {lastScan.registerCheck.found ? (
                    <div className="text-sm space-y-2 text-left">
                      {lastScan.registerCheck.licenceSector && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Sector:</span>
                          <span className="font-semibold text-right">{lastScan.registerCheck.licenceSector}</span>
                        </div>
                      )}
                      {lastScan.registerCheck.status && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Status:</span>
                          <span className={`font-bold ${lastScan.registerCheck.status === 'Active' ? 'text-green-600' : 'text-amber-600'}`}>
                            {lastScan.registerCheck.status}
                          </span>
                        </div>
                      )}
                      {lastScan.registerCheck.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Expires:</span>
                          <span className="font-mono">{lastScan.registerCheck.expiryDate}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 font-medium mt-2">
                      {lastScan.registerCheck.error || 'SIA number not found on official register'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400 italic border-2 border-dashed border-gray-300 rounded-lg bg-white/20 p-4">
                  {lastScan.siaNumber !== 'STEWARD' ? 'Register check unavailable' : 'No register check for stewards'}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-xs mt-6 text-gray-500 font-medium">{lastScan.message}</p>
        </div>
      );
    }

    // Render sign-in card (existing logic)
    return (
      <div className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 ${style.bg} animate-in zoom-in-50 duration-300`}>
        {style.icon}
        <h2 className={`text-2xl font-bold ${style.text} uppercase mb-6`}>
          {isSteward ? 'STEWARD' : lastScan.status}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Left Column: Staff Details */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-2">
            {lastScan.siaNumber && lastScan.siaNumber !== 'STEWARD' && (
              <p className="text-base font-mono font-bold bg-white/60 px-3 py-1 rounded border border-black/5 w-fit">
                SIA: {lastScan.siaNumber}
              </p>
            )}
            {isSteward && (
              <p className="text-base font-semibold mb-2 bg-white/50 px-3 py-1 rounded border text-yellow-800 w-fit">
                STEWARD CHECK-IN
              </p>
            )}
            
            <p className="text-2xl font-bold text-gray-900">{lastScan.staffName}</p>
            
            {lastScan.role && (
              <p className="text-sm font-semibold bg-white/60 px-3 py-1 rounded border border-black/5 w-fit">
                {lastScan.role}
              </p>
            )}
            
            <p className="text-base font-medium opacity-80">{lastScan.providerName}</p>
            
            {lastScan.startTime && lastScan.endTime && (
              <p className="text-sm font-medium bg-white/60 px-3 py-1 rounded border border-black/5 mt-1 w-fit">
                Shift: {lastScan.startTime.substring(0, 5)} - {lastScan.endTime.substring(0, 5)}
              </p>
            )}
          </div>

          {/* Right Column: Register Check */}
          <div className="flex flex-col justify-start h-full">
            {lastScan.registerCheck && lastScan.siaNumber && lastScan.siaNumber !== 'STEWARD' ? (
              <div className={`w-full rounded-lg border-2 p-4 h-full ${lastScan.registerCheck.found ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-3 border-b border-black/5 pb-2">
                  {lastScan.registerCheck.found ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-base font-bold text-green-700">Found in Register</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-base font-bold text-red-700">Not Found in Register</span>
                    </>
                  )}
                </div>
                {lastScan.registerCheck.found ? (
                  <div className="text-sm space-y-2 text-left">
                    {lastScan.registerCheck.licenceSector && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Sector:</span>
                        <span className="font-semibold text-right">{lastScan.registerCheck.licenceSector}</span>
                      </div>
                    )}
                    {lastScan.registerCheck.status && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Status:</span>
                        <span className={`font-bold ${lastScan.registerCheck.status === 'Active' ? 'text-green-600' : 'text-amber-600'}`}>
                          {lastScan.registerCheck.status}
                        </span>
                      </div>
                    )}
                    {lastScan.registerCheck.expiryDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Expires:</span>
                        <span className="font-mono">{lastScan.registerCheck.expiryDate}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-600 font-medium mt-2">
                    {lastScan.registerCheck.error || 'SIA number not found on official register'}
                  </p>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400 italic border-2 border-dashed border-gray-300 rounded-lg bg-white/20 p-4">
                {isSteward ? 'No register check for stewards' : 'Register check unavailable'}
              </div>
            )}
          </div>
        </div>
        
        <p className="text-xs mt-6 text-gray-500 font-medium">{lastScan.message}</p>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {showBrowserWarning && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <span className="font-bold">Browser Warning:</span> For the best scanning performance and camera compatibility, please use <span className="font-bold">Google Chrome</span>. Other browsers may have issues accessing the camera or scanning barcodes.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setShowBrowserWarning(false)}
                  className="inline-flex rounded-md bg-amber-50 p-1.5 text-amber-500 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-amber-50"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-2 border-b">
         <div className="flex items-center gap-2">
            <Link href={`/admin/events/${id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <Image 
                src="/CheckPoint.png?v=1" 
                alt="CheckPoint" 
                width={300} 
                height={80}
                className="h-12 w-auto"
                style={{ background: 'transparent' }}
                priority
                unoptimized
            />
         </div>
         <div className="text-sm font-mono">
            Count: <span className="font-bold">{checkInCount}</span>
         </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 animate-pulse border-green-200">
          ● LIVE
        </Badge>
      </div>

      {/* Desktop Layout: 2 columns, Mobile: 1 column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Camera and Statistics */}
        <div className="space-y-6">

      {/* SCANNER VIEWPORT */}
      <Card className="overflow-hidden shadow-lg border-0 bg-black relative">
        <div id="reader" className="w-full bg-black min-h-[300px] relative" />
        
        {/* Blur overlay - blurs everything outside the guide box */}
        {/* Top blur (above guide box) */}
        <div 
          className="absolute top-0 left-0 right-0 pointer-events-none z-10"
          style={{
            height: '32%',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />
        {/* Left blur (left of guide box) */}
        <div 
          className="absolute top-[32%] left-0 pointer-events-none z-10"
          style={{
            width: '5%',
            height: '25%',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />
        {/* Right blur (right of guide box) */}
        <div 
          className="absolute top-[32%] right-0 pointer-events-none z-10"
          style={{
            width: '5%',
            height: '25%',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />
        {/* Bottom blur (below guide box) */}
        <div 
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
          style={{
            height: '43%',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />
        
        {/* Scanning Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Guide Box - Area for badge number/barcode */}
            <div 
              id="scan-guide"
              className="absolute border-4 border-green-400 rounded-lg z-30"
              style={{
                top: '32%',
                left: '5%',
                width: '90%',
                height: '25%',
                backgroundColor: 'transparent',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
              }}
            >
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
              
              {/* Instruction text */}
              <div className="absolute -bottom-10 left-0 right-0 text-center">
                <p className="text-white text-sm font-semibold drop-shadow-lg bg-black/50 px-3 py-1 rounded">
                  Position badge number or barcode here
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {!isScannerReady && !scannerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Initializing camera...</p>
            </div>
          </div>
        )}
        {scannerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 z-10">
            <div className="text-center">
              <p className="text-red-400 mb-2">⚠️ Camera Error</p>
              <p className="text-sm mb-4">{scannerError}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="text-white border-white hover:bg-white/10"
              >
                Reload Page
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* MANUAL ENTRY TABS */}
      <Card className="p-4">
        <Tabs defaultValue="sia" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sia">Manual SIA Entry</TabsTrigger>
            <TabsTrigger value="steward">Steward</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sia" className="mt-4">
            <div className="space-y-2">
              <Label htmlFor="sia-input">Enter SIA Number Manually</Label>
              <div className="flex gap-2">
                <Input
                  id="sia-input"
                  type="text"
                  value={manualSiaInput}
                  onChange={(e) => setManualSiaInput(e.target.value)}
                  placeholder="1017 0487 7704 6490"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualSiaInput.trim()) {
                      handleSiaNumber(manualSiaInput.trim().replace(/\s/g, ''), 'manual');
                      setManualSiaInput('');
                    }
                  }}
                />
                <Button 
                  onClick={() => {
                    if (manualSiaInput.trim()) {
                      handleSiaNumber(manualSiaInput.trim().replace(/\s/g, ''), 'manual');
                      setManualSiaInput('');
                    }
                  }}
                  disabled={!manualSiaInput.trim()}
                >
                  Check In
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="steward" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="steward-name">Person's Name</Label>
                <Input
                  id="steward-name"
                  type="text"
                  value={stewardName}
                  onChange={(e) => setStewardName(e.target.value)}
                  placeholder="Enter name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && stewardName.trim() && stewardProvider.trim()) {
                      handleStewardCheckIn();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steward-provider">Provider</Label>
                <Input
                  id="steward-provider"
                  type="text"
                  value={stewardProvider}
                  onChange={(e) => setStewardProvider(e.target.value)}
                  placeholder="Enter provider name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && stewardName.trim() && stewardProvider.trim()) {
                      handleStewardCheckIn();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={handleStewardCheckIn}
                disabled={!stewardName.trim() || !stewardProvider.trim()}
                className="w-full"
              >
                Check In
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

          {/* RESULT CARD */}
          {renderResultCard()}

          {/* STATISTICS */}
          {statistics && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider">Statistics</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500">Staff Booked</p>
                  <p className="text-lg font-bold">{statistics.staffBooked}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">In Provider Lists</p>
                  <p className="text-lg font-bold">{statistics.staffInProviderLists}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Scanned Correctly</p>
                  <p className="text-lg font-bold text-green-600">{statistics.scannedCorrectly}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Duplicates</p>
                  <p className="text-lg font-bold text-amber-600">{statistics.duplicates}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-gray-500">Rejected</p>
                  <p className="text-lg font-bold text-red-600">{statistics.rejected}</p>
                </div>
              </div>
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN: Recent Scans in 2 columns on desktop */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Recent Scans</h3>
            {scanHistory.length > 0 && (
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteScans}
                      disabled={selectedScans.size === 0}
                      className="h-7 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete ({selectedScans.size})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditMode(false);
                        setSelectedScans(new Set());
                      }}
                      className="h-7 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    className="h-7 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
          {scanHistory.length === 0 ? (
            <div className="text-center text-gray-400 text-xs py-4">No scans yet</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {scanHistory.map((scan) => {
                const isSteward = scan.siaNumber === 'STEWARD';
                const isSelected = selectedScans.has(scan.id);
                return (
                  <div 
                    key={scan.id} 
                    className={`flex items-center justify-between p-3 border rounded-lg shadow-sm text-sm transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                        : isSteward 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                          : scan.status === 'signed_out'
                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800'
                            : 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isEditMode && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleScanSelection(scan.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                        />
                      )}
                      {!isEditMode && (
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isSteward ? 'bg-yellow-500' :
                          scan.status === 'signed_out' ? 'bg-blue-500' :
                          scan.status === 'verified' ? 'bg-green-500' : 
                          scan.status === 'unlisted' ? 'bg-red-500' : 
                          scan.status === 'duplicate' ? 'bg-amber-500' : 'bg-gray-500'
                        }`} />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium truncate leading-tight">{scan.staffName}</p>
                            {scan.role && (
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{scan.role}</p>
                            )}
                          </div>
                          {scan.status === 'signed_out' && (
                             <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                               Signed Out
                             </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {scan.providerName}
                          {scan.siaNumber && scan.siaNumber !== 'STEWARD' && (
                            <span className="font-mono text-gray-400 ml-1">({scan.siaNumber.slice(-4)})</span>
                          )}
                        </div>

                        {(scan.signInTime || scan.signOutTime) && (
                          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-dashed border-gray-100">
                            {scan.signInTime && (
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-green-600 font-medium">IN</span>
                                <span className="text-gray-600 font-mono">
                                  {new Date(scan.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                            {scan.signOutTime && (
                              <>
                                <span className="text-gray-300">|</span>
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-blue-600 font-medium">OUT</span>
                                  <span className="text-gray-600 font-mono">
                                    {new Date(scan.signOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        
                        {isSteward && (
                          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 truncate mt-1">STEWARD</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* VERIFIED CHECK-INS TABLE - Full Width */}
      {verifiedCheckIns.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Verified Check-Ins</h3>
          <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50 dark:bg-slate-800 z-10">
                  <TableRow>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">SIA Number</TableHead>
                    <TableHead className="font-semibold">Sign In</TableHead>
                    <TableHead className="font-semibold">Sign Out</TableHead>
                    <TableHead className="font-semibold">Shift Time</TableHead>
                    <TableHead className="font-semibold">Expiry Date</TableHead>
                    <TableHead className="font-semibold">Provider</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiedCheckIns.map((checkIn) => (
                    <TableRow key={checkIn.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium">{checkIn.staffName}</TableCell>
                      <TableCell>
                        {checkIn.role ? (
                          <Badge variant="outline" className="font-normal">
                            {checkIn.role}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{checkIn.siaNumber}</TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">
                        {checkIn.signInTime ? (
                          new Date(checkIn.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">
                        {checkIn.signOutTime ? (
                          new Date(checkIn.signOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {checkIn.startTime && checkIn.endTime ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="font-medium">
                              {checkIn.startTime.substring(0, 5)} - {checkIn.endTime.substring(0, 5)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {checkIn.siaExpiryDate ? (
                          new Date(checkIn.siaExpiryDate).toLocaleDateString()
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{checkIn.providerName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

