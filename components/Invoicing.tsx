import React from 'react';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import EmptyState from './EmptyState';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const Invoicing: React.FC = () => {
    const { invoices, projects } = useData();

    const getProjectName = (projectId: number) => {
        return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
    };
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Sent': return 'bg-blue-100 text-blue-800';
            case 'Draft': return 'bg-gray-100 text-gray-800';
            case 'Void': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Invoicing</h1>

            {invoices.length > 0 ? (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Invoice #</th>
                                    <th scope="col" className="px-6 py-3">Project</th>
                                    <th scope="col" className="px-6 py-3">Issue Date</th>
                                    <th scope="col" className="px-6 py-3">Due Date</th>
                                    <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                    <th scope="col" className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => (
                                    <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
                                                {invoice.invoiceNumber}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">{getProjectName(invoice.projectId)}</td>
                                        <td className="px-6 py-4">{format(invoice.issueDate, 'MMM d, yyyy')}</td>
                                        <td className="px-6 py-4">{format(invoice.dueDate, 'MMM d, yyyy')}</td>
                                        <td className="px-6 py-4 text-right font-semibold">${invoice.totalAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <EmptyState
                    title="No Invoices Yet"
                    message="Generate an invoice from a project's detail page to see it here."
                    buttonText="View Projects"
                    onButtonClick={() => {}} // This can be improved to navigate to projects
                />
            )}
        </div>
    );
};

export default Invoicing;
