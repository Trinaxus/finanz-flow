import React, { useState } from 'react';
import { Check, Plus, ShoppingCart, Package, Euro } from 'lucide-react';
import { useStore } from '../store';

export const ShoppingList = () => {
  const { shoppingList, addShoppingItem, toggleShoppingItem } = useStore();
  const [newItem, setNewItem] = useState({ name: '', estimated: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addShoppingItem({
      name: newItem.name,
      estimated: Number(newItem.estimated)
    });
    setNewItem({ name: '', estimated: '' });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="relative flex-1">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={newItem.name}
            onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Artikelname"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="relative w-32">
          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="number"
            value={newItem.estimated}
            onChange={e => setNewItem(prev => ({ ...prev, estimated: e.target.value }))}
            placeholder="Preis"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          type="submit"
          className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </form>

      <div className="space-y-2">
        {shoppingList.map(item => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              item.purchased
                ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleShoppingItem(item.id)}
                className={`p-2 rounded-full ${
                  item.purchased
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
              <span className={item.purchased ? 'line-through text-gray-500' : ''}>
                {item.name}
              </span>
            </div>
            <span className="font-medium">€{item.estimated.toFixed(2)}</span>
          </div>
        ))}
        
        {shoppingList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-display">Deine Einkaufsliste ist leer</p>
          </div>
        )}
      </div>
    </div>
  );
};