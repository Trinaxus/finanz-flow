import React, { useState } from 'react';
import { Wallet, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { useStore } from '../store';

export const AccountBalance = () => {
  const { 
    baseAccountBalance, 
    updateBaseAccountBalance, 
    calculateMonthBalance,
    getCurrentBalance
  } = useStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newBalance, setNewBalance] = useState(baseAccountBalance.toString());

  const now = new Date();
  const monthBalance = calculateMonthBalance(now.getMonth(), now.getFullYear());

  // Berechne den verfügbaren Betrag basierend auf bestätigten Transaktionen
  // Jetzt wird die Bilanz vom Basiskontostand abgezogen
  const availableBalance = baseAccountBalance + monthBalance.balance;

  // Berechne den projizierten Betrag inklusive ausstehender Transaktionen
  const projectedBalance = availableBalance + monthBalance.pending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBaseAccountBalance(Number(newBalance));
    setIsEditing(false);
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6" />
          <h2 className="text-lg font-display">Kontostand</h2>
        </div>

        {!isEditing && (
          <button
            onClick={() => {
              setIsEditing(true);
              setNewBalance(baseAccountBalance.toString());
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40"
              placeholder="Neuer Basiskontostand"
            />
            <button
              type="submit"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Speichern"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Abbrechen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Hauptkontostände */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <p className="text-sm opacity-75 mb-1">Basiskontostand</p>
              <p className="text-2xl font-bold">€{baseAccountBalance.toFixed(2)}</p>
            </div>
          </div>
          
          {/* Monatliche Bewegungen */}
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4" />
              <p className="font-medium">Aktuelle Monatsbewegungen:</p>
            </div>
            
            <div className="grid grid-cols-[1fr,auto] gap-x-4 gap-y-2 text-sm">
              <p>Bestätigte Einnahmen:</p>
              <p className="text-right text-emerald-300">+€{monthBalance.income.toFixed(2)}</p>
              
              <p>Bestätigte Ausgaben:</p>
              <p className="text-right text-rose-300">-€{monthBalance.expenses.toFixed(2)}</p>
              
              <p>Bilanz:</p>
              <p className={`text-right ${monthBalance.balance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {monthBalance.balance >= 0 ? '+' : ''}€{monthBalance.balance.toFixed(2)}
              </p>
              
              <div className="col-span-2 h-px bg-white/20 my-2" />
              
              <p className="font-medium">Aktueller Kontostand:</p>
              <p className="text-right font-bold">€{availableBalance.toFixed(2)}</p>
              
              {monthBalance.pending !== 0 && (
                <>
                  <p>Ausstehende Buchungen:</p>
                  <p className={`text-right ${monthBalance.pending >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {monthBalance.pending >= 0 ? '+' : ''}€{monthBalance.pending.toFixed(2)}
                  </p>
                  
                  <div className="col-span-2 h-px bg-white/20 my-2" />
                  
                  <p className="font-medium">Projizierter Kontostand:</p>
                  <p className="text-right font-bold text-lg">€{projectedBalance.toFixed(2)}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};