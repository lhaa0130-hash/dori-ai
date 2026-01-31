// src/components/RightSideAd.jsx
import React from 'react';

const AdPlaceholder = () => (
  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 h-64 flex items-center justify-center">
    <span className="text-gray-500 dark:text-gray-400">Advertisement</span>
  </div>
);

const RightSideAd = () => {
  return (
    <aside className="fixed right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col z-40 gap-6">
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">ADVERTISEMENT</div>
        <AdPlaceholder />
      </div>
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">ADVERTISEMENT</div>
        <AdPlaceholder />
      </div>
    </aside>
  );
};

export default RightSideAd;
