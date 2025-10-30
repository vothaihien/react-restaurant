
import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="h-20 flex items-center justify-between px-8 bg-gray-900 border-b border-gray-700">
            <div>
                {/* Potentially add search or other actions here */}
            </div>
            <div className="text-right">
                <p className="text-lg font-semibold text-white">{time.toLocaleTimeString()}</p>
                <p className="text-sm text-gray-400">{time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
        </header>
    );
};

export default Header;
