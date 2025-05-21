"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react"; // Requires lucide-react or replace with your own icon

const CustomModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOutsideClick = true,
  footer,
  showCloseButton = true,
}) => {
  const modalRef = useRef(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Handle outside click
  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Dynamic width based on size prop
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full ${sizeClasses[size] || "max-w-md"} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {title && <h3 className="text-lg font-medium">{title}</h3>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Modal content */}
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {children}
        </div>
        
        {/* Modal footer */}
        {footer && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomModal;