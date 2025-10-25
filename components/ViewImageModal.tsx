import React from 'react';
import Modal from './Modal';

interface ViewImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

const ViewImageModal: React.FC<ViewImageModalProps> = ({ isOpen, onClose, imageUrl, title = 'View Image' }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex justify-center items-center">
        <img 
          src={imageUrl} 
          alt={title} 
          className="max-w-full max-h-[80vh] object-contain rounded-md"
        />
      </div>
    </Modal>
  );
};

export default ViewImageModal;