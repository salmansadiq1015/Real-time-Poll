import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Copy, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollUrl: string;
  pollTitle: string;
}

export function QRCodeModal({ isOpen, onClose, pollUrl, pollTitle }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      generateQRCode();
    }
  }, [isOpen, pollUrl]);

  const generateQRCode = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, pollUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });

      // Also generate data URL for download
      const dataUrl = await QRCode.toDataURL(pollUrl, {
        width: 600,
        margin: 4,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `poll-qr-${pollTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded!');
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      toast.success('Poll URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const shareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pollTitle,
          url: pollUrl,
        });
      } catch (error) {
        // Fallback to copy
        copyUrl();
      }
    } else {
      copyUrl();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 transform animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Share Poll</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Scan QR code to vote</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>

        {/* Poll Title */}
        <div className="text-center mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {pollTitle}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
            {pollUrl}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={downloadQRCode}
            className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 transform hover:scale-105"
          >
            <Download className="h-5 w-5 mb-2" />
            <span className="text-xs font-medium">Download</span>
          </button>
          
          <button
            onClick={copyUrl}
            className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 transform hover:scale-105"
          >
            <Copy className="h-5 w-5 mb-2" />
            <span className="text-xs font-medium">Copy URL</span>
          </button>
          
          <button
            onClick={shareUrl}
            className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 transform hover:scale-105"
          >
            <Share2 className="h-5 w-5 mb-2" />
            <span className="text-xs font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}