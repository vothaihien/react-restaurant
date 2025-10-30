
import React from 'react';
import type { Table } from '../types';
import { TableStatus } from '../types';

interface TableCardProps {
    table: Table;
    onClick: () => void;
}

const TableCard: React.FC<TableCardProps> = ({ table, onClick }) => {
    const getStatusStyles = () => {
        switch (table.status) {
            case TableStatus.Available:
                return 'border-green-500 bg-green-500/10 hover:bg-green-500/20';
            case TableStatus.Occupied:
                return 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20';
            case TableStatus.Reserved:
                return 'border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20';
            case TableStatus.CleaningNeeded:
                return 'border-red-500 bg-red-500/10 hover:bg-red-500/20';
            default:
                return 'border-gray-600 bg-gray-700/20 hover:bg-gray-700/40';
        }
    };

    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-lg border-2 shadow-lg cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-1 ${getStatusStyles()}`}
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">{table.name}</h3>
                <span className="text-sm font-semibold text-gray-300">Cap: {table.capacity}</span>
            </div>
            <p className="mt-2 text-md font-medium text-gray-200">{table.status}</p>
        </div>
    );
};

export default TableCard;
