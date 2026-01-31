// src/components/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-amber-800 text-white mt-16">
      <div className="container mx-auto px-6 py-8 text-center">
        <p>&copy; {new Date().getFullYear()} DORI-AI. All rights reserved.</p>
        <p className="text-sm text-amber-200 mt-2">아이들을 위한 즐거운 동물도감</p>
      </div>
    </footer>
  );
};

export default Footer;
