
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
                return 'border-green-500 bg-green-50 hover:bg-green-100';
            case TableStatus.Occupied:
                return 'border-blue-500 bg-blue-50 hover:bg-blue-100';
            case TableStatus.Reserved:
                return 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100';
            case TableStatus.CleaningNeeded:
                return 'border-red-500 bg-red-50 hover:bg-red-100';
            default:
                return 'border-gray-300 bg-white hover:bg-gray-50';
        }
    };

    const viStatus = () => {
        switch (table.status) {
            case TableStatus.Available:
                return 'Trống';
            case TableStatus.Occupied:
                return 'Đang sử dụng';
            case TableStatus.Reserved:
                return 'Đã đặt';
            case TableStatus.CleaningNeeded:
                return 'Chờ dọn';
            default:
                return String(table.status);
        }
    };

    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-1 ${getStatusStyles()}`}
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{table.name}</h3>
                <span className="text-sm font-semibold text-gray-600">Sức chứa: {table.capacity}</span>
            </div>
            <p className="mt-2 text-md font-medium text-gray-800">{viStatus()}</p>
        </div>
    );
};

export default TableCard;
