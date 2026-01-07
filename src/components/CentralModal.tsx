import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { createPortal } from 'react-dom';
import './CentralModal.css';

interface CentralModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  originElement?: HTMLElement | null;
}

export const CentralModal: React.FC<CentralModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnBackdrop = true,
  originElement
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  // Calcular posición de origen del botón
  const getOriginPosition = () => {
    if (originElement) {
      const rect = originElement.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  };

  const origin = getOriginPosition();

  // Asegurar que el modal se monte sobre document.body
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let root = document.getElementById('central-modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'central-modal-root';
      document.body.appendChild(root);
    }
    setPortalNode(root);

    return () => {
      if (root && root.childElementCount === 0) {
        root.remove();
      }
    };
  }, []);

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && closeOnBackdrop) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnBackdrop, onClose]);

  const sizeClasses = {
    small: 'central-modal-small',
    medium: 'central-modal-medium',
    large: 'central-modal-large',
    full: 'central-modal-full'
  };

  if (!portalNode) return null;

  const modalMarkup = (
    <AnimatePresence>
      {isOpen && (
        <div className="central-modal-container">
          {/* Backdrop */}
          <motion.div
            className="central-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            className={`central-modal-content ${sizeClasses[size]}`}
            initial={{
              opacity: 0,
              scale: 0,
              x: origin.x - window.innerWidth / 2,
              y: origin.y - window.innerHeight / 2,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              x: origin.x - window.innerWidth / 2,
              y: origin.y - window.innerHeight / 2,
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
              duration: 0.3
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="central-modal-header">
                {title && <h2 className="central-modal-title">{title}</h2>}
                {showCloseButton && (
                  <button
                    className="central-modal-close-btn"
                    onClick={onClose}
                    aria-label="Cerrar"
                  >
                    <IonIcon icon={closeOutline} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="central-modal-body">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalMarkup, portalNode);
};

export default CentralModal;
