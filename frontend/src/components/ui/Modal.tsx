import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesome } from './FontAwesome';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  className = '',
  overlayClassName = '',
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm ${overlayClassName}`}
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={className} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'secondary';
  confirmLoading?: boolean;
  icon?: string;
  className?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  confirmVariant = 'danger',
  confirmLoading = false,
  icon = 'triangle-exclamation',
  className = 'card w-full max-w-[420px] p-5 shadow-2xl relative',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={confirmLoading ? undefined : onClose} className={className}>
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
            confirmVariant === 'danger'
              ? 'bg-danger-soft border border-danger-line text-danger'
              : 'bg-accent-soft border border-accent-line text-accent-text'
          }`}
        >
          <FontAwesome name={icon} className="text-[12px]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
          <div className="text-[12.5px] text-ink-2 leading-relaxed mt-1">{message}</div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={confirmLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          size="sm"
          onClick={onConfirm}
          loading={confirmLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
