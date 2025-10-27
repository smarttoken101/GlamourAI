
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import VirtualTryOn from './components/VirtualTryOn';
import InspirationGallery from './components/InspirationGallery';
import AIAssistant from './components/AIAssistant';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TRY_ON);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case Tab.TRY_ON:
        return <VirtualTryOn />;
      case Tab.GALLERY:
        return <InspirationGallery />;
      case Tab.ASSISTANT:
        return <AIAssistant />;
      default:
        return <VirtualTryOn />;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 antialiased">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-4 md:p-8 lg:p-12">
        {renderContent()}
      </main>
      <footer className="text-center p-4 text-stone-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Glamour AI Studio. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
