import React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Mobile view */}
      <div className="flex items-center gap-2 sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-lg border transition-all",
            currentPage === 1
              ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-indigo-400 hover:text-indigo-600"
          )}
        >
          ‹
        </button>
        <span className="text-sm text-gray-700 px-2">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-lg border transition-all",
            currentPage === totalPages
              ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-indigo-400 hover:text-indigo-600"
          )}
        >
          ›
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-l-lg border border-r-0 transition-all",
            currentPage === 1
              ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600"
          )}
          aria-label="Trang trước"
        >
          ‹
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-sm font-medium text-gray-500 border-t border-b border-gray-300 bg-white"
              >
                ...
              </span>
            );
          }
          const pageNum = page as number;
          const isActive = currentPage === pageNum;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "px-4 py-2 text-sm font-medium border border-r-0 transition-all",
                isActive
                  ? "z-10 bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600"
              )}
              aria-label={`Trang ${pageNum}`}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-r-lg border transition-all",
            currentPage === totalPages
              ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600"
          )}
          aria-label="Trang sau"
        >
          ›
        </button>
      </div>
    </div>
  );
};
