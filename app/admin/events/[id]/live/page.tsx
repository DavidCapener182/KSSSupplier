'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { createWorker } from 'tesseract.js';
import { processScan, processStewardCheckIn, ScanResult, getCheckInStats, getCheckInStatistics, getVerifiedCheckIns, getRecentScans, deleteCheckIns, type CheckInStatistics, type VerifiedCheckIn, type RecentScan } from '@/app/actions/checkpoint-actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, X } from 'lucide-react';
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
  
  // Scanner Refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ocrWorkerRef = useRef<any>(null);
  const { toast } = useToast();

  // Extract SIA number from text (format: XXXX XXXX XXXX XXXX or similar)
  const extractSiaNumber = (text: string): string | null => {
    console.log('Extracting SIA number from text:', text);
    
    // Remove all spaces and look for patterns like: 101704877046490 or 1017 0487 7704 6490
    const cleaned = text.replace(/\s/g, '');
    
    // Look for 16-digit numbers (SIA license numbers are typically 16 digits)
    // Pattern: 4 groups of 4 digits with optional spaces
    const siaPattern = /(\d{4}\s?\d{4}\s?\d{4}\s?\d{4})/;
    const match = text.match(siaPattern);
    
    if (match) {
      const number = match[0].replace(/\s/g, '');
      console.log('Found SIA number (16 digits):', number);
      return number;
    }
    
    // Also try to find any sequence of 12-16 digits (in case of OCR errors)
    const longNumberPattern = /\d{12,16}/;
    const longMatch = cleaned.match(longNumberPattern);
    if (longMatch) {
      const number = longMatch[0];
      console.log('Found SIA number (12-16 digits):', number);
      return number;
    }
    
    // Try to find the pattern from the card: numbers that look like license numbers
    // Sometimes OCR might read "1017 0487 7704 6490" as "101704877046490" or with OCR errors
    const flexiblePattern = /(\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4})/;
    const flexMatch = text.match(flexiblePattern);
    if (flexMatch) {
      const number = flexMatch[0].replace(/[\s-]/g, '');
      if (number.length >= 12 && number.length <= 16) {
        console.log('Found SIA number (flexible pattern):', number);
        return number;
      }
    }
    
    console.log('No SIA number found in text');
    return null;
  };

  // OCR function to read text from canvas
  const performOCR = async (canvas: HTMLCanvasElement): Promise<string | null> => {
    if (!ocrWorkerRef.current) {
      console.log('Initializing OCR worker...');
      ocrWorkerRef.current = await createWorker('eng');
      console.log('OCR worker initialized');
    }
    
    try {
      // Convert canvas to data URL (Tesseract can handle this format reliably)
      const dataUrl = canvas.toDataURL('image/png');
      const { data: { text } } = await ocrWorkerRef.current.recognize(dataUrl);
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

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Pass canvas directly to OCR (Tesseract works better with canvas than ImageData)
        const text = await performOCR(canvas);
        
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
    const siaNumber = decodedText.trim().toUpperCase();
    await handleSiaNumber(siaNumber, 'barcode');
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
          verbose: true,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Enable native BarcodeDetector API for better barcode scanning
          }
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
            qrbox: undefined, // Scan entire viewport for easier scanning
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
            // Log all errors for debugging, but don't show them to user
            // NotFoundException is normal when no barcode is in view
            if (errorMessage) {
              if (errorMessage.includes('NotFoundException') || 
                  errorMessage.includes('No QR code found') ||
                  errorMessage.includes('No barcode found')) {
                // These are normal - just means no barcode visible
                return;
              }
              // Log other errors for debugging
              console.log('Scanner error:', errorMessage);
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
              // Wait for video to be ready
              video.addEventListener('loadedmetadata', () => {
                console.log('Video metadata loaded, starting OCR');
                startOCRScanning(video);
              }, { once: true });
              
              // Also try immediately in case it's already loaded
              if (video.readyState >= 2) {
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
    
    const styles = {
      verified: { 
        bg: isSteward ? 'bg-yellow-100' : 'bg-green-100', 
        text: isSteward ? 'text-yellow-800' : 'text-green-800', 
        icon: isSteward ? <AlertTriangle className="h-12 w-12 text-yellow-600 mb-2" /> : <CheckCircle className="h-12 w-12 text-green-600 mb-2" />
      },
      unlisted: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="h-12 w-12 text-red-600 mb-2" /> },
      duplicate: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <AlertTriangle className="h-12 w-12 text-amber-600 mb-2" /> },
      error: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <XCircle className="h-12 w-12 text-gray-600 mb-2" /> },
    };

    const style = styles[lastScan.status] || styles.error;

    return (
      <div className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 ${style.bg} animate-in zoom-in-50 duration-300`}>
        {style.icon}
        <h2 className={`text-2xl font-bold ${style.text} uppercase mb-1`}>
          {isSteward ? 'STEWARD' : lastScan.status}
        </h2>
        {lastScan.siaNumber && lastScan.siaNumber !== 'STEWARD' && (
          <p className="text-base font-mono font-semibold mb-2 bg-white/50 px-3 py-1 rounded border">
            SIA: {lastScan.siaNumber}
          </p>
        )}
        {isSteward && (
          <p className="text-base font-semibold mb-2 bg-white/50 px-3 py-1 rounded border text-yellow-800">
            STEWARD CHECK-IN
          </p>
        )}
        <p className="text-lg font-semibold">{lastScan.staffName}</p>
        <p className="text-sm opacity-75">{lastScan.providerName}</p>
        <p className="text-xs mt-2 text-gray-500">{lastScan.message}</p>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
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
        <div id="reader" className="w-full bg-black min-h-[300px]" />
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

          {/* VERIFIED CHECK-INS LIST */}
          {verifiedCheckIns.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider">Verified Check-Ins</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {verifiedCheckIns.map((checkIn) => (
                  <Card key={checkIn.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-base">{checkIn.staffName}</p>
                          <p className="text-sm font-mono text-gray-600 mt-1">SIA: {checkIn.siaNumber}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(checkIn.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {checkIn.siaExpiryDate && (
                          <div>
                            <p className="text-gray-500">Expiry Date</p>
                            <p className="font-medium">{new Date(checkIn.siaExpiryDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {checkIn.startTime && checkIn.endTime && (
                          <div>
                            <p className="text-gray-500">Shift Time</p>
                            <p className="font-medium">
                              {checkIn.startTime.substring(0, 5)} - {checkIn.endTime.substring(0, 5)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">Provider</p>
                        <p className="text-sm font-medium">{checkIn.providerName}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
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
                          : 'bg-white dark:bg-slate-900'
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
                          scan.status === 'verified' ? 'bg-green-500' : 
                          scan.status === 'unlisted' ? 'bg-red-500' : 
                          scan.status === 'duplicate' ? 'bg-amber-500' : 'bg-gray-500'
                        }`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{scan.staffName}</p>
                        {scan.siaNumber && scan.siaNumber !== 'STEWARD' && (
                          <p className="text-xs font-mono text-gray-600 truncate">SIA: {scan.siaNumber}</p>
                        )}
                        {isSteward && (
                          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 truncate">STEWARD</p>
                        )}
                        <p className="text-xs text-gray-500 truncate">{scan.providerName}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

