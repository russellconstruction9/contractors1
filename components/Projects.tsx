import React, { useState } from 'react';
import { useData } from '../hooks/useDataContext';
import Button from './Button';
import { PlusIcon, CameraIcon } from './icons/Icons';
import AddProjectModal from './AddProjectModal';
import EmptyState from './EmptyState';
import ProjectListItem from './ProjectListItem'; // Import the new reusable component
import ScanReceiptModal from './ScanReceiptModal';

const Projects: React.FC = () => {
    const { projects } = useData();
    const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
    const [isScanReceiptModalOpen, setIsScanReceiptModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Projects</h1>
                <div className="flex items-center gap-2">
                     <Button onClick={() => setIsScanReceiptModalOpen(true)} variant="secondary">
                        <CameraIcon className="w-5 h-5 mr-2 -ml-1" />
                        Scan Receipt
                    </Button>
                    <Button onClick={() => setIsAddProjectModalOpen(true)}>
                        <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                        New Project
                    </Button>
                </div>
            </div>

            {projects.length > 0 ? (
                <div className="space-y-4">
                    {projects.map(project => (
                        <ProjectListItem key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No Projects Yet"
                    message="Get started by creating your first project."
                    buttonText="New Project"
                    onButtonClick={() => setIsAddProjectModalOpen(true)}
                />
            )}

            <AddProjectModal isOpen={isAddProjectModalOpen} onClose={() => setIsAddProjectModalOpen(false)} />
            <ScanReceiptModal isOpen={isScanReceiptModalOpen} onClose={() => setIsScanReceiptModalOpen(false)} />
        </div>
    );
};

export default Projects;