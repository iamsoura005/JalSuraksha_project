'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Language options with their codes and names
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'മലയാളം' }
  ];

  // Change language
  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.language-selector')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="language-selector relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.254-.269-.498-.546-.73-.832-.203.297-.416.587-.64 865-.872a1 1 0 11-1.64-.26c.232-.377.45-.763.654-1.157H3a1 1 0 110-2h3.426c.36-.683.75-1.34 1.17-1.967a1 1 0 011.44.26c.254.269.498.546.73.832.203-.297.416-.587.64-.872a1 1 0 111.64.26c-.232.377-.45.763-.654 1.157H13a1 1 0 110 2h-1.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.254-.269-.498-.546-.73-.832-.203.297-.416.587-.64.872a1 1 0 11-1.64-.26c.232-.377.45-.763.654-1.157H3a1 1 0 110-2h3.426c.36-.683.75-1.34 1.17-1.967a1 1 0 011.44-.26z" clipRule="evenodd" />
        </svg>
        {languages.find(lang => lang.code === i18n.language)?.name || 'English'}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`block px-4 py-2 text-sm text-left w-full ${
                i18n.language === language.code
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}