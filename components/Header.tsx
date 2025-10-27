
import React from 'react';
import { Tab } from '../types';
import { SparklesIcon, CameraIcon, ChatBubbleIcon } from './icons/Icons';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: Tab.TRY_ON, label: 'Virtual Try-On', icon: <CameraIcon className="w-5 h-5 mr-2" /> },
    { id: Tab.GALLERY, label: 'Inspiration Gallery', icon: <SparklesIcon className="w-5 h-5 mr-2" /> },
    { id: Tab.ASSISTANT, label: 'AI Assistant', icon: <ChatBubbleIcon className="w-5 h-5 mr-2" /> },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-20 py-4 sm:py-0">
          <div className="flex items-center mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold font-serif text-stone-900 tracking-wider">Glamour<span className="text-rose-500">AI</span></h1>
          </div>
          <nav>
            <ul className="flex space-x-2 sm:space-x-4">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center px-3 py-2 text-sm sm:text-base font-medium rounded-md transition-colors duration-200 ${
                      activeTab === item.id
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
                    }`}
                  >
                    {item.icon}
                    <span className="hidden md:inline">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
