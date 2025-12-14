/**
 * ExportVoucherButtons.tsx - Component hiển thị 2 nút xuất Excel và PDF
 * 
 * Props:
 * - data: VoucherExportData - Dữ liệu phiếu cần xuất
 * - className?: string - CSS classes tùy chỉnh
 * 
 * Features:
 * - 2 nút: "Xuất Excel" và "Xuất PDF"
 * - Loading state khi đang export
 * - Disable nếu items > 30
 * - Gọi Backend API để export, FE chỉ download + save file
 */

import React, { useState } from 'react';
import type { VoucherExportData } from '../../app/exportApi';
import { exportToExcel, exportToPdf } from '../../app/exportApi';

interface ExportVoucherButtonsProps {
  data: VoucherExportData;
  className?: string;
}

export const ExportVoucherButtons: React.FC<ExportVoucherButtonsProps> = ({
  data,
  className = '',
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const isDisabled = data.items.length > 30;
  const isLoading = isExportingExcel || isExportingPDF;

  const handleExportExcel = async () => {
    if (isDisabled || isLoading) return;

    setIsExportingExcel(true);
    try {
      await exportToExcel(data);
      // Alert đã được xử lý trong exportToExcel
    } catch (error) {
      console.error('Export Excel error:', error);
      alert('Có lỗi xảy ra khi xuất Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (isDisabled || isLoading) return;

    setIsExportingPDF(true);
    try {
      await exportToPdf(data);
      // Alert đã được xử lý trong exportToPdf
    } catch (error) {
      console.error('Export PDF error:', error);
      alert('Có lỗi xảy ra khi xuất PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Excel Button */}
      <button
        onClick={handleExportExcel}
        disabled={isDisabled || isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-150
          ${
            isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isExportingExcel
              ? 'bg-green-600 text-white cursor-wait'
              : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
          }
        `}
        title={isDisabled ? 'Template hỗ trợ tối đa 30 dòng' : 'Xuất file Excel'}
      >
        {isExportingExcel ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Đang xuất...</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <span>Xuất Excel</span>
          </>
        )}
      </button>

      {/* PDF Button */}
      <button
        onClick={handleExportPDF}
        disabled={isDisabled || isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-150
          ${
            isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isExportingPDF
              ? 'bg-red-600 text-white cursor-wait'
              : 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
          }
        `}
        title={isDisabled ? 'Template hỗ trợ tối đa 30 dòng' : 'Xuất file PDF'}
      >
        {isExportingPDF ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Đang xuất...</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span>Xuất PDF</span>
          </>
        )}
      </button>

      {isDisabled && (
        <div className="flex items-center text-sm text-red-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 mr-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span>Quá 30 dòng</span>
        </div>
      )}
    </div>
  );
};
