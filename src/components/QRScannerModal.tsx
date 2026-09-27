import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  X,
  Camera,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Truck,
  Wrench,
  Search,
  RefreshCw,
  SwitchCamera,
  Flashlight,
  FlashlightOff,
  Upload,
  Volume2,
  VolumeX,
  Sparkles,
  Barcode
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import { useApp } from '../context/AppContext';
import { Product, ProductUnit } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult?: (code: string) => void;
  targetMode?: 'lookup' | 'checkout' | 'checkin' | 'opname' | 'damage';
  onNavigateTab?: (tab: string, entityId?: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
  targetMode = 'lookup',
  onNavigateTab
}) => {
  const { products, warehouses, events } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [scannedItem, setScannedItem] = useState<{
    product: Product;
    unit?: ProductUnit;
    currentEvent?: any;
    warehouseName?: string;
    rawCode: string;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Camera & hardware states
  const [isStarting, setIsStarting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState<number>(0);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [justScanned, setJustScanned] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Play modern subtle beep sound using Web Audio API
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch {
      // Audio playback might be restricted if no user interaction yet
    }
  }, [soundEnabled]);

  const handleResolveCode = useCallback((code: string) => {
    const clean = code.trim();
    if (!clean) return;

    if (onScanResult) {
      onScanResult(clean);
    }

    // Search by product code, barcode, qrCode, or serial number
    let foundProduct = products.find(
      p =>
        p.code.toLowerCase() === clean.toLowerCase() ||
        p.barcode.toLowerCase() === clean.toLowerCase() ||
        p.qrCode.toLowerCase() === clean.toLowerCase() ||
        (p.serialNumber && p.serialNumber.toLowerCase() === clean.toLowerCase())
    );

    let foundUnit: ProductUnit | undefined;

    // If not found in primary product info, check individual units
    if (!foundProduct) {
      for (const p of products) {
        if (p.units && p.units.length > 0) {
          const matchUnit = p.units.find(
            u =>
              u.unitCode.toLowerCase() === clean.toLowerCase() ||
              u.serialNumber.toLowerCase() === clean.toLowerCase() ||
              u.barcode.toLowerCase() === clean.toLowerCase() ||
              u.qrCode.toLowerCase() === clean.toLowerCase()
          );
          if (matchUnit) {
            foundProduct = p;
            foundUnit = matchUnit;
            break;
          }
        }
      }
    }

    if (foundProduct) {
      const wh = warehouses.find(w => w.id === (foundUnit?.warehouseId || foundProduct?.warehouseId));
      let currentEvt;
      if (foundUnit?.currentEventId) {
        currentEvt = events.find(e => e.id === foundUnit?.currentEventId);
      } else if (foundProduct.status === 'IN_USE') {
        currentEvt = events.find(e => e.status === 'Berlangsung' || e.status === 'Loading');
      }

      setScannedItem({
        product: foundProduct,
        unit: foundUnit,
        warehouseName: wh ? wh.name : 'Gudang Pusat',
        currentEvent: currentEvt,
        rawCode: clean
      });
      setScanError(null);
    } else {
      setScanError(`Kode "${clean}" terdeteksi, namun belum terdaftar di database inventaris.`);
      setScannedItem(null);
    }
  }, [products, warehouses, events, onScanResult]);

  // Cleanly stop scanner instance
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setIsStarting(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // Start scanner with active video stream
  const startScanner = useCallback(async (cameraIdOverride?: string) => {
    if (!isOpen) return;

    await stopScanner();

    setIsStarting(true);
    setCameraError(null);

    // Wait for modal DOM element to mount
    await new Promise(resolve => setTimeout(resolve, 80));

    const element = document.getElementById('glpro-qr-scanner');
    if (!element) {
      setIsStarting(false);
      setCameraError('Komponen viewport kamera tidak ditemukan di layar.');
      return;
    }

    try {
      const scanner = new Html5Qrcode('glpro-qr-scanner', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX
        ],
        verbose: false
      });

      scannerRef.current = scanner;

      // Query available camera devices
      let deviceId: any = cameraIdOverride;
      let detectedCameras: CameraDevice[] = [];
      try {
        detectedCameras = await Html5Qrcode.getCameras();
        if (detectedCameras && detectedCameras.length > 0) {
          setCameras(detectedCameras);
          if (!deviceId) {
            // Find back / environment camera if available
            const rearIndex = detectedCameras.findIndex(c =>
              /back|rear|belakang|environment/i.test(c.label)
            );
            if (rearIndex !== -1) {
              deviceId = detectedCameras[rearIndex].id;
              setSelectedCameraIndex(rearIndex);
            } else {
              deviceId = detectedCameras[0].id;
              setSelectedCameraIndex(0);
            }
          }
        }
      } catch (camErr) {
        console.warn('Could not enumerate cameras:', camErr);
      }

      // If no specific camera id, fallback to facingMode environment
      const cameraConfig = deviceId ? deviceId : { facingMode: 'environment' };

      const scanConfig = {
        fps: 20,
        qrbox: (viewWidth: number, viewHeight: number) => {
          // Generous scan box for both 1D barcodes and 2D QR codes
          const w = Math.floor(Math.min(viewWidth * 0.88, 360));
          const h = Math.floor(Math.min(viewHeight * 0.72, 260));
          return { width: Math.max(w, 200), height: Math.max(h, 150) };
        },
        aspectRatio: 1.333333,
        disableFlip: false
      };

      await scanner.start(
        cameraConfig,
        scanConfig,
        (decodedText: string) => {
          // Debounce rapid continuous scans of same code
          const now = Date.now();
          if (
            lastScannedCodeRef.current === decodedText &&
            now - lastScanTimeRef.current < 2500
          ) {
            return;
          }

          lastScannedCodeRef.current = decodedText;
          lastScanTimeRef.current = now;

          playBeep();
          setJustScanned(true);
          setTimeout(() => setJustScanned(false), 1200);

          handleResolveCode(decodedText);
        },
        () => {
          // Normal frame with no barcode; silent ignore
        }
      );

      setCameraActive(true);
      setIsStarting(false);

      // Check if torch/flashlight is supported
      try {
        const capabilities = scanner.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setTorchSupported(true);
        }
      } catch {
        setTorchSupported(false);
      }
    } catch (err: any) {
      console.warn('Camera start failed:', err);
      setIsStarting(false);
      setCameraActive(false);

      let errorMsg = 'Gagal mengakses kamera.';
      const msgStr = (err && (err.message || err.name || String(err))) || '';

      if (msgStr.includes('NotAllowedError') || msgStr.includes('Permission')) {
        errorMsg = 'Izin akses kamera ditolak oleh browser. Mohon izinkan akses kamera di pengaturan browser/situs Anda untuk memindai barcode secara langsung.';
      } else if (msgStr.includes('NotFoundError') || msgStr.includes('OverconstrainedError')) {
        errorMsg = 'Kamera tidak ditemukan atau spesifikasi lensa tidak sesuai. Coba beralih ke kamera lain atau gunakan input manual.';
      } else if (msgStr.includes('NotReadableError') || msgStr.includes('in use')) {
        errorMsg = 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi yang menggunakan kamera lalu coba lagi.';
      } else {
        errorMsg = `Tidak dapat memuat video kamera: ${msgStr || 'Periksa koneksi kamera perangkat.'}`;
      }

      setCameraError(errorMsg);
    }
  }, [isOpen, stopScanner, playBeep, handleResolveCode]);

  // Manage open / close lifecycle
  useEffect(() => {
    if (isOpen) {
      setScannedItem(null);
      setScanError(null);
      setManualCode('');
      lastScannedCodeRef.current = null;
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  // Flip / Switch camera
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (selectedCameraIndex + 1) % cameras.length;
    setSelectedCameraIndex(nextIndex);
    const nextCam = cameras[nextIndex];
    if (nextCam) {
      await startScanner(nextCam.id);
    }
  };

  // Toggle flashlight
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const nextState = !torchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Scan from uploaded file / photo
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanError(null);
      let scanner = scannerRef.current;
      let tempScanner = false;

      if (!scanner) {
        scanner = new Html5Qrcode('glpro-qr-scanner');
        tempScanner = true;
      }

      const decodedText = await scanner.scanFile(file, true);
      playBeep();
      setJustScanned(true);
      setTimeout(() => setJustScanned(false), 1200);
      handleResolveCode(decodedText);

      if (tempScanner) {
        scanner.clear();
      }
    } catch (err) {
      setScanError('Barcode tidak terbaca pada file gambar yang dipilih. Pastikan foto jelas, fokus, dan tidak terpotong.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Demo shortcut items for instant testing
  const demoCodes = [
    { label: 'Sony FX3 Cinema (CAM-01A)', code: 'QR-CAM-01A' },
    { label: 'Yamaha CL5 Digital (CL5-01)', code: 'QR-CL5-01' },
    { label: 'Moving Head Beam 230', code: 'QR-INV-LGT-0001' },
    { label: 'Absen LED P3.9 Outdoor', code: 'QR-INV-LED-0001' },
    { label: 'Shure Axient Mic', code: 'QR-INV-AUD-0002' },
    { label: 'MacBook Pro M3 Max', code: 'QR-INV-MM-0001' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Live Camera Barcode & QR Scanner</h3>
                {cameraActive && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Mode Target: <span className="font-semibold text-orange-400 uppercase tracking-wide">{targetMode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio beep mute toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Suara beep aktif' : 'Suara beep dibisukan'}
              className={`p-2 rounded-lg border transition ${
                soundEnabled
                  ? 'bg-zinc-800 text-orange-400 border-zinc-700 hover:bg-zinc-700'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
              title="Tutup Scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport: Live Camera Feed */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px] overflow-hidden border-b border-zinc-800">
          
          {/* Target Element for Html5Qrcode */}
          <div
            id="glpro-qr-scanner"
            className="w-full h-full min-h-[260px] sm:min-h-[300px] flex items-center justify-center bg-black"
          />

          {/* Loading Indicator while requesting camera */}
          {isStarting && (
            <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center text-center p-6">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-3" />
              <p className="text-sm font-semibold text-white">Menghubungkan ke Kamera Perangkat...</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Mohon beri izin browser jika muncul permintaan izin kamera.
              </p>
            </div>
          )}

          {/* Error / Permission Blocked View */}
          {!isStarting && cameraError && (
            <div className="absolute inset-0 z-20 bg-black/95 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-white mb-1">Akses Kamera Terkendala</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{cameraError}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => startScanner()}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Akses Kamera Lagi</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-orange-400" />
                  <span>Upload Foto Barcode</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Live Viewfinder Overlay (Visible when camera is active) */}
          {cameraActive && (
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-between p-4">
              
              {/* Top Controls on Camera View */}
              <div className="w-full flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px]">
                  <Barcode className="w-3.5 h-3.5 text-orange-400" />
                  <span>Auto-Scan QR & Barcode 1D</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Torch toggle */}
                  {torchSupported && (
                    <button
                      onClick={handleToggleTorch}
                      className={`p-2 rounded-xl backdrop-blur-md border transition ${
                        torchOn
                          ? 'bg-amber-500 text-black border-amber-400 font-bold'
                          : 'bg-black/60 text-white border-white/15 hover:bg-black/80'
                      }`}
                      title="Nyalakan Lampu Sorot / Senter"
                    >
                      {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                    </button>
                  )}

                  {/* Switch camera button if multiple cameras found */}
                  {cameras.length > 1 && (
                    <button
                      onClick={handleSwitchCamera}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/15 backdrop-blur-md transition flex items-center gap-1"
                      title="Ganti Lensa Kamera"
                    >
                      <SwitchCamera className="w-4 h-4 text-orange-400" />
                      <span className="text-[10px] font-mono pr-0.5">#{selectedCameraIndex + 1}</span>
                    </button>
                  )}

                  {/* Upload file fallback button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/15 backdrop-blur-md transition"
                    title="Scan dari Foto / Gambar Galeri"
                  >
                    <Upload className="w-4 h-4 text-zinc-300" />
                  </button>
                </div>
              </div>

              {/* Viewfinder Reticle Frame */}
              <div
                className={`relative w-64 sm:w-72 h-44 sm:h-48 rounded-2xl border-2 transition-all duration-300 ${
                  justScanned
                    ? 'border-emerald-400 shadow-2xl shadow-emerald-500/50 scale-105'
                    : 'border-orange-500/60 shadow-xl shadow-orange-500/20'
                }`}
              >
                {/* 4 Corner L-Brackets */}
                <div
                  className={`absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 rounded-tl-lg transition-colors ${
                    justScanned ? 'border-emerald-400' : 'border-orange-400'
                  }`}
                />
                <div
                  className={`absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 rounded-tr-lg transition-colors ${
                    justScanned ? 'border-emerald-400' : 'border-orange-400'
                  }`}
                />
                <div
                  className={`absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 rounded-bl-lg transition-colors ${
                    justScanned ? 'border-emerald-400' : 'border-orange-400'
                  }`}
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 rounded-br-lg transition-colors ${
                    justScanned ? 'border-emerald-400' : 'border-orange-400'
                  }`}
                />

                {/* Laser scan line animation */}
                {!justScanned && (
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-laser shadow-[0_0_12px_#f97316]" />
                )}

                {/* Success Flash Indicator */}
                {justScanned && (
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl flex items-center justify-center animate-in fade-in duration-150">
                    <div className="px-3 py-1.5 rounded-full bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Barcode Terdeteksi!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Guideline */}
              <div className="w-full text-center pb-1">
                <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-zinc-300 font-medium">
                  Arahkan barcode atau stiker QR ke dalam kotak pemindai
                </span>
              </div>

            </div>
          )}

          {/* Hidden File Input for Image Scanning */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileScan}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          
          {/* Quick Demo Barcode Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-400" />
                <span>Simulasi Cepat Barcode / QR Demo:</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 transition"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Foto Barcode</span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {demoCodes.map(d => (
                <button
                  key={d.code}
                  onClick={() => {
                    setManualCode(d.code);
                    playBeep();
                    handleResolveCode(d.code);
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-orange-600 hover:text-white text-[11px] text-zinc-300 border border-zinc-800 transition font-mono"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual text input search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Atau masukkan Kode / Barcode / SN manual..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    playBeep();
                    handleResolveCode(manualCode);
                  }
                }}
              />
            </div>
            <button
              onClick={() => {
                playBeep();
                handleResolveCode(manualCode);
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition shrink-0"
            >
              Cari Kode
            </button>
          </div>

          {/* Scan Error Alert */}
          {scanError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <span className="font-semibold block">Item Tidak Ditemukan</span>
                <span className="text-[11px] text-rose-300">{scanError}</span>
              </div>
            </div>
          )}

          {/* Scanned Item Result Card */}
          {scannedItem && (
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={scannedItem.product.imageUrl}
                    alt={scannedItem.product.name}
                    className="w-16 h-16 rounded-xl object-cover border border-zinc-800 shrink-0 bg-black"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">
                        {scannedItem.unit ? scannedItem.unit.unitCode : scannedItem.product.code}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {scannedItem.rawCode}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white leading-snug">
                      {scannedItem.product.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {scannedItem.product.brand} • {scannedItem.product.model}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      scannedItem.product.status === 'AVAILABLE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : scannedItem.product.status === 'IN_USE'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {scannedItem.product.status}
                  </span>
                  <div className="text-[10px] text-zinc-400 mt-1.5">
                    Kondisi: <span className="text-white font-semibold">{scannedItem.product.condition}</span>
                  </div>
                </div>
              </div>

              {/* Detail Location & Stock Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/60 p-3 rounded-xl border border-zinc-800/80">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Lokasi Gudang</span>
                  <span className="text-zinc-200 font-medium">{scannedItem.warehouseName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Posisi Rak & Box</span>
                  <span className="text-zinc-200 font-medium">
                    {scannedItem.product.rack} - {scannedItem.product.shelf}
                    {scannedItem.product.box ? ` (${scannedItem.product.box})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Stok Gudang</span>
                  <span className="text-zinc-200 font-medium">
                    {scannedItem.product.availableQty} Tersedia / {scannedItem.product.totalQty} Total {scannedItem.product.unit}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Serial Number / Barcode</span>
                  <span className="text-orange-400 font-mono font-medium truncate block">
                    {scannedItem.unit?.serialNumber || scannedItem.product.serialNumber || scannedItem.product.barcode}
                  </span>
                </div>
              </div>

              {/* Event indicator if currently deployed */}
              {scannedItem.currentEvent && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Sedang Digunakan di: <strong className="text-white">{scannedItem.currentEvent.name}</strong></span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">
                    {scannedItem.currentEvent.eventCode}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setScannedItem(null);
                    lastScannedCodeRef.current = null;
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
                  <span>Scan Barang Lain</span>
                </button>

                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab('inventory', scannedItem.product.id);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-700 transition"
                  >
                    <Boxes className="w-3.5 h-3.5 text-orange-400" />
                    <span>Lihat di Master</span>
                  </button>
                )}

                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab('inspection', scannedItem.product.id);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 font-semibold text-xs border border-rose-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Lapor Kerusakan</span>
                  </button>
                )}

                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab(
                        targetMode === 'checkin' ? 'checkin' : 'checkout',
                        scannedItem.product.id
                      );
                    }}
                    className="py-1.5 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/30 transition"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{targetMode === 'checkin' ? 'Check-In' : 'Check-Out'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <Camera className="w-3.5 h-3.5 text-orange-500" />
            <span>Kamera aktif otomatis saat modal terbuka</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>

      </div>
    </div>
  );
};
