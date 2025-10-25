import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { format } from 'date-fns';
import { ChevronLeftIcon, CameraIcon, FileTextIcon, PlusIcon, PaperclipIcon } from './icons/Icons';
import PhotoItem from './PhotoItem';
import { getPhotosForProject, getPhoto } from '../utils/db';
import { generatePdfReport } from '../utils/reportGenerator';
import LogMaterialModal from './LogMaterialModal';
import ViewImageModal from './ViewImageModal';

const ProjectDetails: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects, tasks, users, timeLogs, materialLogs, invoices, generateInvoice } = useData();
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
    
    const project = projects.find(p => p.id === Number(projectId));
    
    if (!project) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">Project not found</h1>
                <p className="mt-2 text-gray-600">The project you are looking for does not exist.</p>
                <Link to="/projects" className="mt-4 inline-block text-blue-600 hover:underline">
                    &larr; Back to all projects
                </Link>
            </div>
        );
    }
    
    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            const projectTimeLogs = timeLogs.filter(log => log.projectId === project.id);
            const projectTasks = tasks.filter(task => task.projectId === project.id);
            const projectPhotos = await getPhotosForProject(project.id, project.photos);

            await generatePdfReport({
                project,
                tasks: projectTasks,
                timeLogs: projectTimeLogs,
                photos: projectPhotos,
                users,
            });

        } catch (error) {
            console.error("Failed to generate report:", error);
            alert("Sorry, there was an error generating the report. Please check the console for details.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleViewReceipt = async (photoId: string) => {
        const url = await getPhoto(photoId);
        if (url) {
            setViewingImageUrl(url);
        } else {
            alert("Could not load receipt image.");
        }
    };

    const projectTasks = useMemo(() => tasks.filter(task => task.projectId === project.id), [tasks, project.id]);
    const projectInvoices = useMemo(() => invoices.filter(invoice => invoice.projectId === project.id), [invoices, project.id]);
    const projectMaterials = useMemo(() => {
        return materialLogs
            .filter(log => log.projectId === project.id)
            .sort((a,b) => b.dateUsed.getTime() - a.dateUsed.getTime());
    }, [materialLogs, project.id]);
    
    const taskProgress = useMemo(() => {
        const completedTasks = projectTasks.filter(task => task.status === 'Done').length;
        return projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
    }, [projectTasks]);
    
    const budgetUsedPercentage = useMemo(() => (
        project.budget > 0 ? Math.round((project.currentSpend / project.budget) * 100) : 0
    ), [project.budget, project.currentSpend]);


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <Link to="/projects" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" />
                    Back to Projects
                </Link>
                <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
                    <FileTextIcon className="w-5 h-5 mr-2 -ml-1" />
                    {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </Button>
            </div>


            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
                        <p className="text-gray-500 mt-1">{project.address}</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-left md:text-right">
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">{project.type}</span>
                        <p className="text-sm text-gray-500 mt-2">{format(project.startDate, 'MMM d, yyyy')} - {format(project.endDate, 'MMM d, yyyy')}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Task Progress</span>
                        <span className="text-sm font-medium text-gray-700">{taskProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${taskProgress}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <Link to={`/projects/${project.id}/tasks`}>
                            <h2 className="text-xl font-bold mb-4 hover:text-blue-600">Tasks ({projectTasks.length})</h2>
                        </Link>
                        {projectTasks.length > 0 ? (
                            <ul className="space-y-4">
                                {projectTasks.slice(0, 3).map(task => {
                                    const assignee = users.find(u => u.id === task.assigneeId);
                                    return (
                                        <li key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{task.title}</p>
                                                <p className="text-sm text-gray-500">Due: {format(task.dueDate, 'MMM d')}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${task.status === 'Done' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{task.status}</span>
                                                {assignee && <img src={assignee.avatarUrl} alt={assignee.name} title={assignee.name} className="w-8 h-8 rounded-full" />}
                                            </div>
                                        </li>
                                    );
                                })}
                                {projectTasks.length > 3 && (
                                    <p className="text-sm text-gray-500 pt-2 text-center">... and {projectTasks.length - 3} more</p>
                                )}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No tasks assigned to this project yet.</p>
                        )}
                        <Link to={`/projects/${project.id}/tasks`} className="mt-4 w-full block text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                            View All / Add Task
                        </Link>
                    </Card>

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Materials Logged ({projectMaterials.length})</h2>
                            <Button onClick={() => setIsMaterialModalOpen(true)} variant="secondary">
                                <PlusIcon className="w-4 h-4 mr-2" /> Log Material
                            </Button>
                        </div>
                         {projectMaterials.length > 0 ? (
                            <div className="overflow-x-auto max-h-60">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-gray-600 sticky top-0">
                                        <tr>
                                            <th className="p-2">Date</th>
                                            <th className="p-2">Item</th>
                                            <th className="p-2 text-right">Qty</th>
                                            <th className="p-2 text-right">Cost</th>
                                            <th className="p-2 text-center">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectMaterials.map(log => (
                                            <tr key={log.id} className="border-b">
                                                <td className="p-2">{format(log.dateUsed, 'MMM d, yyyy')}</td>
                                                <td className="p-2 font-medium">{log.description}</td>
                                                <td className="p-2 text-right">{log.quantityUsed}</td>
                                                <td className="p-2 text-right font-semibold">${log.costAtTime.toFixed(2)}</td>
                                                <td className="p-2 text-center">
                                                    {log.receiptPhotoId && (
                                                        <button onClick={() => handleViewReceipt(log.receiptPhotoId!)} title="View Receipt" className="p-1 hover:bg-gray-200 rounded-full">
                                                            <PaperclipIcon className="w-4 h-4 text-blue-600" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No materials have been logged for this project yet.</p>
                        )}
                    </Card>

                     <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Invoices ({projectInvoices.length})</h2>
                            <Button onClick={() => generateInvoice(project.id)}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Generate Invoice
                            </Button>
                        </div>
                         {projectInvoices.length > 0 ? (
                            <ul className="space-y-2">
                                {projectInvoices.map(invoice => (
                                    <li key={invoice.id} className="p-3 bg-gray-50 rounded-lg">
                                        <Link to={`/invoices/${invoice.id}`} className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-blue-700 hover:underline">Invoice #{invoice.invoiceNumber}</p>
                                                <p className="text-sm text-gray-500">Issued: {format(invoice.issueDate, 'MMM d, yyyy')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-lg">${invoice.totalAmount.toFixed(2)}</p>
                                                <p className="text-sm font-medium text-gray-600">{invoice.status}</p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No invoices have been generated for this project.</p>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                     <Card>
                        <h2 className="text-xl font-bold mb-4">Financials</h2>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm font-medium text-gray-600">
                                    <span>Costs to Date</span>
                                    <span>Budget</span>
                                </div>
                                 <div className="flex justify-between text-sm font-semibold text-gray-800">
                                    <span>${project.currentSpend.toFixed(2)}</span>
                                    <span>${project.budget.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                    <div 
                                        className={`${budgetUsedPercentage > 100 ? 'bg-red-500' : 'bg-green-500'} h-2.5 rounded-full`} 
                                        style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className={project.budget - project.currentSpend < 0 ? 'text-red-600' : 'text-gray-600'}>
                                        {project.budget - project.currentSpend < 0 ? 'Over Budget' : 'Remaining'}
                                    </span>
                                    <span className={`font-semibold ${project.budget - project.currentSpend < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                        ${Math.abs(project.budget - project.currentSpend).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <Link to={`/punch-lists/${project.id}`} className="block">
                            <h2 className="text-xl font-bold mb-4 hover:text-blue-600">Punch List ({project.punchList.length})</h2>
                        </Link>
                         {project.punchList.length > 0 ? (
                            <ul className="space-y-2">
                                {project.punchList.slice(0, 3).map(item => (
                                    <li key={item.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={item.isComplete}
                                            readOnly
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className={`ml-2 text-sm ${item.isComplete ? 'text-gray-500 line-through' : ''}`}>
                                            {item.text}
                                        </span>
                                    </li>
                                ))}
                                {project.punchList.length > 3 && <p className="text-sm text-gray-500 mt-2">+ {project.punchList.length - 3} more</p>}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No punch list items yet.</p>
                        )}
                    </Card>

                    <Card>
                         <Link to={`/projects/${project.id}/photos`} className="block">
                            <h2 className="text-xl font-bold mb-4 hover:text-blue-600">Project Photos ({project.photos.length})</h2>
                        </Link>
                        {project.photos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {project.photos.slice(0, 4).map(photo => (
                                    <PhotoItem key={photo.id} projectId={project.id} photo={photo} className="aspect-square w-full rounded-md object-cover" />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                <CameraIcon className="w-12 h-12 mx-auto text-gray-300" />
                                <p className="mt-2 text-sm">No photos added yet.</p>
                            </div>
                        )}
                         <Link to={`/projects/${project.id}/photos`} className="mt-4 w-full block text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                            View All / Add Photo
                        </Link>
                    </Card>
                </div>
            </div>
             <LogMaterialModal
                isOpen={isMaterialModalOpen}
                onClose={() => setIsMaterialModalOpen(false)}
                projectId={project.id}
            />
            {viewingImageUrl && (
                <ViewImageModal 
                    isOpen={true}
                    onClose={() => setViewingImageUrl(null)}
                    imageUrl={viewingImageUrl}
                    title="Receipt"
                />
            )}
        </div>
    );
};

export default ProjectDetails;