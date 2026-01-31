// src/components/SideNav.jsx
import React from 'react';

const navItems = [
  { id: 'home', label: '홈', href: '#home' },
  { id: 'features', label: '기능', href: '#features' },
  { id: 'insight', label: '인사이트', href: '#insight' },
  { id: 'community', label: '커뮤니티', href: '#community' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
];

const SideNav = () => {
  return (
    <aside className="fixed left-0 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
      <nav className="ml-8">
        <div className="flex flex-col gap-2 p-2 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 group-hover:bg-blue-500 transition-colors duration-300" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-300">
                {item.label}
              </span>
            </a>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default SideNav;
