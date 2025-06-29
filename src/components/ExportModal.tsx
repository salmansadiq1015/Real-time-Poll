import React, { useState } from 'react';
import { X, Download, FileText, Image, BarChart3 } from 'lucide-react';
import { Poll, VoteResult } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  poll: Poll;
  results: VoteResult[];
  totalVotes: number;
}

export function ExportModal({ isOpen, onClose, poll, results, totalVotes }: ExportModalProps) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    try {
      const csvContent = [
        ['Poll Question', poll.question],
        ['Total Votes', totalVotes.toString()],
        ['Created At', new Date(poll.created_at).toLocaleString()],
        [''],
        ['Option', 'Votes', 'Percentage'],
        ...results.map(result => [
          result.option_text,
          result.vote_count.toString(),
          `${result.percentage}%`
        ])
      ];

      const csvString = csvContent
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `poll-results-${poll.id}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF();
      
      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(59, 130, 246);
      pdf.text('Poll Results Report', 20, 30);
      
      // Poll details
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Question: ${poll.question}`, 20, 50);
      pdf.text(`Total Votes: ${totalVotes}`, 20, 65);
      pdf.text(`Created: ${new Date(poll.created_at).toLocaleString()}`, 20, 80);
      
      // Results table
      let yPosition = 100;
      pdf.setFontSize(14);
      pdf.text('Results:', 20, yPosition);
      yPosition += 20;
      
      pdf.setFontSize(10);
      results.forEach((result, index) => {
        pdf.text(`${index + 1}. ${result.option_text}`, 25, yPosition);
        pdf.text(`${result.vote_count} votes (${result.percentage}%)`, 25, yPosition + 10);
        yPosition += 25;
        
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
      });
      
      pdf.save(`poll-results-${poll.id}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportToImage = async () => {
    setExporting(true);
    try {
      // Find the poll results element
      const resultsElement = document.querySelector('[data-export="poll-results"]') as HTMLElement;
      if (!resultsElement) {
        toast.error('Results not found for export');
        return;
      }

      const canvas = await html2canvas(resultsElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `poll-results-${poll.id}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success('Image exported successfully!');
    } catch (error) {
      console.error('Error exporting image:', error);
      toast.error('Failed to export image');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 transform animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Export Results</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Download poll data in various formats</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="w-full flex items-center p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-2xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center mr-4">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold">Export as CSV</h4>
              <p className="text-sm opacity-75">Spreadsheet-compatible format</p>
            </div>
            <Download className="h-5 w-5" />
          </button>

          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="w-full flex items-center p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-red-100 dark:bg-red-800 rounded-xl flex items-center justify-center mr-4">
              <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold">Export as PDF</h4>
              <p className="text-sm opacity-75">Professional report format</p>
            </div>
            <Download className="h-5 w-5" />
          </button>

          <button
            onClick={exportToImage}
            disabled={exporting}
            className="w-full flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center mr-4">
              <Image className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold">Export as Image</h4>
              <p className="text-sm opacity-75">PNG image of results chart</p>
            </div>
            <Download className="h-5 w-5" />
          </button>
        </div>

        {/* Export Info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Exporting {totalVotes} votes across {results.length} options
            </span>
          </div>
        </div>

        {exporting && (
          <div className="mt-4 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
            <span className="text-sm">Preparing export...</span>
          </div>
        )}
      </div>
    </div>
  );
}