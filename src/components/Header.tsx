import React, { useState } from 'react';
import { Moon, Sun, Menu, ChevronDown, X, BarChart3, Sparkles } from 'lucide-react';
import { useStore } from '../store';

export const Header = () => {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const neuralBackground = useStore((state) => state.neuralBackground);
  const toggleNeuralBackground = useStore((state) => state.toggleNeuralBackground);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navigation = {
    Übersicht: {
      items: [
        { label: 'Dashboard', href: '#dashboard' },
        { label: 'Monatsvergleich', href: '#monthly' },
        { label: 'Jahresvergleich', href: '#yearly' },
        { label: 'Kategorieanalyse', href: '#categories' },
      ]
    },
    Transaktionen: {
      items: [
        { label: 'Monatsübersicht', href: '#monthly-transactions' },
        { label: 'Alle Transaktionen', href: '#transactions' },
        { label: 'Neue Transaktion', href: '#new-transaction' },
      
      ]
    },
    Verwaltung: {
      items: [
        
        { label: 'CSV Import', href: '#import' },
      ]
    }
  };

  const toggleDropdown = (key: string) => {
    setActiveDropdown(activeDropdown === key ? null : key);
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 container mx-auto px-4">
      <div className="rounded-[190px] backdrop-blur-lg bg-white/75 dark:bg-gray-900/75 border border-white/80 dark:border-gray-700/80 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/30">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl logo-icon logo-glow">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-display gradient-text font-bold tracking-wider leading-none">
                FinanzFlow
              </h1>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-[0.2em] uppercase">
                Finance Manager
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {Object.entries(navigation).map(([key, section]) => (
              <div key={key} className="relative">
                <button
                  onClick={() => toggleDropdown(key)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {key}
                  <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === key ? 'rotate-180' : ''}`} />
                </button>
                {activeDropdown === key && (
                  <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-white/75 dark:bg-gray-900/75 backdrop-blur-lg border border-gray-200/50 dark:border-gray-800/50 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/30 overflow-hidden">
                    <div className="py-2">
                      {section.items.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          className="block px-4 py-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                          onClick={() => setActiveDropdown(null)}
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors ml-2"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={toggleNeuralBackground}
              className={`p-2 rounded-lg transition-colors ${
                neuralBackground 
                  ? 'text-purple-500 hover:bg-purple-500/20' 
                  : 'text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
              }`}
              aria-label="Toggle neural background"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </nav>

          {/* Mobile Menu Buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={toggleNeuralBackground}
              className={`p-2 rounded-lg transition-colors ${
                neuralBackground 
                  ? 'text-purple-500 hover:bg-purple-500/20' 
                  : 'text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
              }`}
              aria-label="Toggle neural background"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-4 mx-4">
            <div className="rounded-2xl backdrop-blur-lg bg-white/75 dark:bg-gray-900/75 border border-white/80 dark:border-gray-700/80 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/30 overflow-hidden">
              <div className="p-4 space-y-2">
                {Object.entries(navigation).map(([key, section]) => (
                  <div key={key} className="space-y-2">
                    <button
                      onClick={() => toggleDropdown(key)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <span className="font-display">{key}</span>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${
                          activeDropdown === key ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>
                    {activeDropdown === key && (
                      <div className="pl-4 space-y-1">
                        {section.items.map((item) => (
                          <a
                            key={item.label}
                            href={item.href}
                            className="block px-4 py-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                            onClick={() => {
                              setActiveDropdown(null);
                              setMobileMenuOpen(false);
                            }}
                          >
                            {item.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};