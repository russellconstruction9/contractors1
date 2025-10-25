import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { ChevronLeftIcon, PlusIcon, CameraIcon } from './icons/Icons';
import AddPunchListPhotoModal from './AddPunchListPhotoModal';
import PhotoMarkupModal from './PhotoMarkupModal';
import PhotoItem from './PhotoItem';
import { getPhoto } from '../utils/db';
import { ProjectPhoto } from '../types';

interface MarkupTarget {
    punchListItemId: number;
    photo: ProjectPhoto;
    photoUrl: string;
}

const PunchListDetails: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects, addPunchListItem, togglePunchListItem, updatePunchListPhoto } = useData();
    const [newItemText, setNewItemText] = useState('');
    const [photoModalTarget, setPhotoModalTarget] = useState<number | null>(null);
    const [markupModalTarget, setMarkupModalTarget] = useState<MarkupTarget | null>(null);
    const [photoVersion, setPhotoVersion] = useState(0); // Used to force re-render PhotoItem after edit

    const project = projects.find(p => p.id === Number(projectId));

    if (!project) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">Project not found</h1>
                <p className="mt-2 text-gray-600">The project you are looking for does not exist.</p>
                <Link to="/punch-lists" className="mt-4 inline-block text-blue-600 hover:underline">
                    &larr; Back to all punch lists
                </Link>
            </div>
        );
    }
    
    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemText.trim()) {
            addPunchListItem(project.id, newItemText.trim());
            setNewItemText('');
        }
    };

    const handleOpenMarkupModal = async (punchListItemId: number, photo: ProjectPhoto) => {
        const key = `punch-${project.id}-${punchListItemId}-${photo.id}`;
        const url = await getPhoto(key);
        if (url) {
            setMarkupModalTarget({ punchListItemId, photo, photoUrl: url });
        } else {
            alert("Could not load image for editing.");
        }
    };
    
    const handleSaveMarkup = async (newImageDataUrl: string) => {
        if (markupModalTarget) {
            const { punchListItemId, photo } = markupModalTarget;
            await updatePunchListPhoto(project.id, punchListItemId, photo.id, newImageDataUrl);
            setMarkupModalTarget(null);
            setPhotoVersion(v => v + 1); // Increment key to force PhotoItem re-render
        }
    };

    const completedItems = project.punchList.filter(item => item.isComplete).length;
    const totalItems = project.punchList.length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return (
        <div className="space-y-6">
            <Link to="/punch-lists" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Back to Punch Lists
            </Link>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Punch List</h1>
                    <p className="text-gray-500 mt-1">For project: {project.name}</p>
                </div>
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-gray-700">
                        {completedItems} / {totalItems} items completed
                    </span>
                    <span className="text-lg font-medium text-gray-700">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-green-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </Card>

            <Card>
                <form onSubmit={handleAddItem} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add new punch list item..."
                        className="flex-grow block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <Button type="submit">
                        <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                        Add Item
                    </Button>
                </form>

                {totalItems > 0 ? (
                    <ul className="space-y-4">
                        {project.punchList.map(item => (
                            <li key={item.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center space-x-4 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={item.isComplete}
                                            onChange={() => togglePunchListItem(project.id, item.id)}
                                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                        />
                                        <span className={`text-base break-all ${item.isComplete ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                            {item.text}
                                        </span>
                                    </label>
                                    <Button variant="secondary" onClick={() => setPhotoModalTarget(item.id)} className="ml-4 flex-shrink-0">
                                        <CameraIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                                {item.photos.length > 0 && (
                                    <div className="mt-4 pl-9">
                                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Attached Photos:</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                            {item.photos.map(photo => (
                                                <div 
                                                    key={`${photo.id}-${photoVersion}`} 
                                                    className="aspect-square rounded-md overflow-hidden cursor-pointer"
                                                    onClick={() => handleOpenMarkupModal(item.id, photo)}
                                                >
                                                    <PhotoItem 
                                                        projectId={project.id} 
                                                        punchListItemId={item.id}
                                                        photo={photo}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-4">This punch list is empty. Add an item to get started.</p>
                )}
            </Card>

            <AddPunchListPhotoModal 
                isOpen={photoModalTarget !== null}
                onClose={() => setPhotoModalTarget(null)}
                projectId={project.id}
                punchListItemId={photoModalTarget!}
            />
            {markupModalTarget && (
                <PhotoMarkupModal
                    isOpen={true}
                    onClose={() => setMarkupModalTarget(null)}
                    photoUrl={markupModalTarget.photoUrl}
                    onSave={handleSaveMarkup}
                />
            )}
        </div>
    );
};

export default PunchListDetails;