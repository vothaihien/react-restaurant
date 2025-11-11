import React, { useState } from 'react';
import type { MenuItem, MenuItemSize } from '@/features/menu/domain/types';
import { formatVND } from '@/shared/utils';

interface MenuItemCardProps {
    item: MenuItem;
    onSelect: (size: MenuItemSize) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onSelect }) => {
    const [showSizes, setShowSizes] = useState(false);

    const handleCardClick = () => {
        if (!item.inStock) return;
        if (item.sizes.length === 1) {
            onSelect(item.sizes[0]);
        } else {
            setShowSizes(true);
        }
    };

    const handleSizeSelect = (size: MenuItemSize) => {
        onSelect(size);
        setShowSizes(false);
    };

    const priceRange = () => {
        if (item.sizes.length === 0) return formatVND(0);
        if (item.sizes.length === 1) return formatVND(item.sizes[0].price);
        const prices = item.sizes.map(s => s.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return `${formatVND(min)} - ${formatVND(max)}`;
    }

    return (
        <div
            onClick={handleCardClick}
            className={`relative rounded-lg overflow-hidden shadow-lg transition-transform transform hover:scale-105 ${item.inStock ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        >
            <img src={item.imageUrls[0]} alt={item.name} className="w-full h-24 object-cover" />

            {!item.inStock && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">OUT OF STOCK</span>
                </div>
            )}

            <div className={`p-2 bg-gray-700 ${!item.inStock ? 'opacity-50' : ''}`}>
                <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                <p className="text-xs text-gray-300">{priceRange()}</p>
            </div>

            {showSizes && item.sizes.length > 1 && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10"
                    onClick={(e) => { e.stopPropagation(); setShowSizes(false); }}>
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg shadow-xl p-4 w-64"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="font-bold text-white text-lg mb-3 text-center">Select Size for {item.name}</h4>
                        <div className="flex flex-col gap-2">
                            {item.sizes.map(size => (
                                <button
                                    key={size.name}
                                    onClick={() => handleSizeSelect(size)}
                                    className="w-full text-left p-3 bg-gray-700 rounded-md hover:bg-indigo-600 transition"
                                >
                                    <span className="font-semibold text-white">{size.name}</span>
                                    <span className="text-gray-300 float-right">{formatVND(size.price)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuItemCard;
