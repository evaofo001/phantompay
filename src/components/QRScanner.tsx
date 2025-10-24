import React, { useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner';
import { processScannedQR, QRScanResult } from '../utils/qrPayUtils';

interface QRScannerProps {
  onScanSuccess: (result: QRScanResult) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          try {
            const scanResult = await processScannedQR(result.data);
            onScanSuccess(scanResult);
            setIsScanning(false);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process QR code';
            setError(errorMessage);
            onScanError?.(errorMessage);
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera
        }
      );
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, [onScanSuccess, onScanError]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);
      await qrScannerRef.current?.start();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start camera';
      setError(errorMessage);
      onScanError?.(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    qrScannerRef.current?.stop();
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Scan QR Code</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 bg-gray-100 rounded-lg"
            playsInline
            muted
          />
          
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p className="text-gray-600">Camera not started</p>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-blue-500 border-dashed rounded-lg w-48 h-48 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-pulse">Scanning...</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mt-4 flex space-x-3">
          {!isScanning ? (
            <button
              onClick={startScanning}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Stop Scanning
            </button>
          )}
          
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>• Point your camera at a QR code</p>
          <p>• Make sure the code is well-lit and in focus</p>
          <p>• Only PhantomPay QR codes are supported</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

