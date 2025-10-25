import React, { useRef, useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { PencilIcon, Trash2Icon } from './icons/Icons';

interface PhotoMarkupModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  onSave: (newImageDataUrl: string) => void;
}

const PhotoMarkupModal: React.FC<PhotoMarkupModalProps> = ({ isOpen, onClose, photoUrl, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    const getCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if (e instanceof MouseEvent) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const ctx = contextRef.current;
        if (!ctx) return;
        const { x, y } = getCoords(e.nativeEvent);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = contextRef.current;
        if (!ctx) return;
        const { x, y } = getCoords(e.nativeEvent);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = contextRef.current;
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
    };
    
    const drawImageOnCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx && photoUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = photoUrl;
            img.onload = () => {
                // Set canvas size to match image
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image
                ctx.drawImage(img, 0, 0);

                // Set drawing styles
                ctx.strokeStyle = '#ef4444'; // Red-500
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                contextRef.current = ctx;
            };
        }
    };
    
    useEffect(drawImageOnCanvas, [photoUrl]);


    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL('image/jpeg', 0.9));
        }
    };
    
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Markup Photo">
            <div className="flex flex-col items-center">
                <div className="flex justify-center gap-4 mb-4">
                    <Button onClick={drawImageOnCanvas} variant="secondary">
                        <Trash2Icon className="w-4 h-4 mr-2" />
                        Clear Markings
                    </Button>
                </div>
                <canvas
                    ref={canvasRef}
                    className="border border-gray-300 rounded-md cursor-crosshair max-w-full h-auto"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                 <div className="flex justify-end w-full space-x-3 pt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
        </Modal>
    );
};

export default PhotoMarkupModal;