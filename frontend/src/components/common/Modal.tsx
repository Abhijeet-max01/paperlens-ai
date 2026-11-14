import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '2xl',
  size,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actualWidth = (size as any) || maxWidth;

  const maxWidthStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
  };

  const chosenStyle = maxWidthStyles[actualWidth] || 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-archival-950/85 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-archival-900 rounded-2xl shadow-2xl border border-archival-750 w-full ${chosenStyle} max-h-[90vh] flex flex-col overflow-hidden transition-all`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-archival-750 bg-archival-950/60">
          <h3 className="text-base font-editorial font-bold text-archival-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-archival-400 hover:text-archival-100 hover:bg-archival-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-archival-200">{children}</div>
      </div>
    </div>
  );
};
