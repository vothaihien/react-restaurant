
import React from 'react';
import { useAppContext } from '../context/AppContext';

const SettingsView: React.FC = () => {
    const { tables, updateTableStatus } = useAppContext();
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-white">Settings</h1>
            <div className="bg-gray-900 rounded-lg shadow-xl p-6">
                <h2 className="text-2xl font-semibold mb-4 text-white">Table Configuration</h2>
                <p className="text-gray-400 mb-6">Manage your restaurant's table layout and staff roles. Below is a list of current tables.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tables.map(table => (
                        <div key={table.id} className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="font-bold text-white">{table.name}</h3>
                            <p className="text-sm text-gray-300">Capacity: {table.capacity}</p>
                            <p className="text-sm text-gray-300">Status: {table.status}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
