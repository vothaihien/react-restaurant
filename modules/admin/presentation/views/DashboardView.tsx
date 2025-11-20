import React, { useState } from 'react';
import { useAppContext } from '@/core/context/AppContext';
import TableCard from '@/components/TableCard';
import OrderModal from '@/components/OrderModal';
import PaymentModal from '@/components/PaymentModal';
import type { Table, Order } from '@/core/types';
import { TableStatus } from '@/features/tables/domain/types';

const DashboardView: React.FC = () => {
    const { tables, getOrderForTable } = useAppContext();
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isOrderModalOpen, setOrderModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

    const handleTableClick = (table: Table) => {
        setSelectedTable(table);
        if (table.status === TableStatus.Available || table.status === TableStatus.Occupied) {
            setOrderModalOpen(true);
        }
    };

    const handleOpenPayment = () => {
        setOrderModalOpen(false);
        setPaymentModalOpen(true);
    }

    const closeAllModals = () => {
        setSelectedTable(null);
        setOrderModalOpen(false);
        setPaymentModalOpen(false);
    };

    const currentOrder = selectedTable ? getOrderForTable(selectedTable.id) : undefined;

    return (
        <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {tables.map((table) => (
                    <TableCard key={table.id} table={table} onClick={() => handleTableClick(table)} />
                ))}
            </div>

            {selectedTable && isOrderModalOpen && (
                <OrderModal
                    table={selectedTable}
                    order={currentOrder}
                    onClose={closeAllModals}
                    onOpenPayment={handleOpenPayment}
                />
            )}

            {selectedTable && isPaymentModalOpen && currentOrder && (
                <PaymentModal
                    order={currentOrder}
                    onClose={closeAllModals}
                />
            )}
        </div>
    );
};

export default DashboardView;
