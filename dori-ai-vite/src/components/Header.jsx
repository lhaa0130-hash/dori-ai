// src/components/Header.jsx
import React from 'react';
import { motion } from 'framer-motion';

import ThemeToggle from './ThemeToggle.jsx';

const Header = () => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md sticky top-0 z-50"
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-2xl font-bold text-amber-800 dark:text-amber-200"
        >
          DORI'S 동물도감
        </motion.div>
        <nav className="hidden md:flex space-x-6">
          <a href="/ai-tools" className="text-gray-600 dark:text-gray-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors">AI TOOLS</a>
          <a href="/insight" className="text-gray-600 dark:text-gray-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors">INSIGHT</a>
          <a href="/project" className="text-gray-600 dark:text-gray-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors">PROJECT</a>
          <a href="/community" className="text-gray-600 dark:text-gray-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors">COMMUNITY</a>
          <a href="/market" className="text-gray-600 dark:text-gray-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors">MARKET</a>
        </nav>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
