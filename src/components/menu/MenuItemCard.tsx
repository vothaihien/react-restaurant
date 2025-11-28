import React, { useState } from 'react';
import type { MenuItem, MenuItemSize } from '@/types/menu';
import { formatVND } from '@/utils';

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
        <>
            <div
                onClick={handleCardClick}
                className={`relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-blue-300 ${
                    item.inStock ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
            >
                {/* Hình ảnh */}
                <div className="w-full aspect-square bg-gray-100">
                    {item.imageUrls && item.imageUrls[0] ? (
                        <img 
                            src={item.imageUrls[0]} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <div className="text-2xl mb-1">🍽️</div>
                                <div className="text-xs">No Image</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Thông tin món ăn */}
                <div className="p-3">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                        {item.name}
                    </h4>
                    <p className="text-green-600 font-medium text-sm mb-2">
                        {priceRange()}
                    </p>
                    
                    {!item.inStock && (
                        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                HẾT HÀNG
                            </span>
                        </div>
                    )}

                    <button
                        className={`w-full py-1.5 text-xs font-medium rounded transition-colors ${
                            item.sizes.length === 1
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        } ${!item.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!item.inStock}
                    >
                        {item.sizes.length === 1 ? 'Thêm vào đơn' : 'Chọn size'}
                    </button>
                </div>
            </div>

            {/* Modal chọn size*/}
            {showSizes && item.sizes.length > 1 && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowSizes(false)}
                >
                    <div
                        className="bg-white rounded-lg w-full max-w-xs mx-auto shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 text-center text-sm">
                                Chọn size cho {item.name}
                            </h3>
                        </div>

                        {/* Danh sách size */}
                        <div className="max-h-60 overflow-y-auto">
                            {item.sizes.map((size, index) => (
                                <button
                                    key={size.name}
                                    onClick={() => handleSizeSelect(size)}
                                    className={`w-full p-3 text-left border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                                        index === 0 ? 'rounded-t-lg' : ''
                                    } ${
                                        index === item.sizes.length - 1 
                                            ? 'border-b-0 rounded-b-lg' 
                                            : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 text-sm">
                                                {size.name}
                                            </div>
                                            {size.name && (
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {size.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-green-600 font-semibold text-sm ml-2">
                                            {formatVND(size.price)}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowSizes(false)}
                                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors rounded border border-gray-300 hover:border-gray-400"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MenuItemCard;