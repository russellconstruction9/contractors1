import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import { ChevronLeftIcon } from './icons/Icons';
import { format } from 'date-fns';
import { Invoice } from '../types';

const InvoiceDetails: React.FC = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const { invoices, projects, updateInvoiceStatus } = useData();
    
    const invoice = invoices.find(i => i.id === Number(invoiceId));
    const project = invoice ? projects.find(p => p.id === invoice.projectId) : null;

    if (!invoice || !project) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">Invoice not found</h1>
                <Link to="/invoicing" className="mt-4 inline-block text-blue-600 hover:underline">
                    &larr; Back to all invoices
                </Link>
            </div>
        );
    }
    
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateInvoiceStatus(invoice.id, e.target.value as Invoice['status']);
    };
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
            case 'Sent': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'Void': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Link to="/invoicing" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Back to Invoices
            </Link>
            
            <Card>
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Invoice #{invoice.invoiceNumber}</h1>
                            <p className="text-gray-500 mt-1">
                                For Project: <Link to={`/projects/${project.id}`} className="font-semibold text-blue-600 hover:underline">{project.name}</Link>
                            </p>
                        </div>
                         <div className="flex items-center gap-4">
                             <select 
                                value={invoice.status} 
                                onChange={handleStatusChange} 
                                className={`text-sm font-semibold rounded-md focus:ring-blue-600 focus:border-blue-600 ${getStatusColor(invoice.status)}`}
                            >
                                <option>Draft</option>
                                <option>Sent</option>
                                <option>Paid</option>
                                <option>Void</option>
                            </select>
                        </div>
                    </div>
                     <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Issue Date</p>
                            <p className="font-semibold">{format(invoice.issueDate, 'MMM d, yyyy')}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Due Date</p>
                            <p className="font-semibold">{format(invoice.dueDate, 'MMM d, yyyy')}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Billed To</p>
                            <p className="font-semibold">{project.name}</p>
                            <p className="text-xs text-gray-500">{project.address}</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-bold mb-2">Line Items</h2>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-left font-semibold">Description</th>
                                        <th className="p-3 text-right font-semibold">Quantity</th>
                                        <th className="p-3 text-right font-semibold">Unit Price</th>
                                        <th className="p-3 text-right font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.laborLineItems.length > 0 && (
                                        <tr className="bg-gray-100 font-bold"><td colSpan={4} className="p-2 text-gray-600">Labor</td></tr>
                                    )}
                                    {invoice.laborLineItems.map((item, index) => (
                                        <tr key={`l-${index}`} className="border-b">
                                            <td className="p-3">{item.description}</td>
                                            <td className="p-3 text-right">{item.quantity} hrs</td>
                                            <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                                            <td className="p-3 text-right">${item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {invoice.materialLineItems.length > 0 && (
                                        <tr className="bg-gray-100 font-bold"><td colSpan={4} className="p-2 text-gray-600">Materials</td></tr>
                                    )}
                                     {invoice.materialLineItems.map((item, index) => (
                                        <tr key={`m-${index}`} className="border-b">
                                            <td className="p-3">{item.description}</td>
                                            <td className="p-3 text-right">{item.quantity}</td>
                                            <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                                            <td className="p-3 text-right">${item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                        <div className="w-full max-w-xs space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold">${invoice.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Markup ({project.markupPercent}%)</span>
                                <span className="font-semibold">${invoice.markupAmount.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between text-base font-bold pt-2 border-t">
                                <span>Total Amount</span>
                                <span>${invoice.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default InvoiceDetails;
