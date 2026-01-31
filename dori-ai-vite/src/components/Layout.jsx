// src/components/Layout.jsx
import React from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

import RocketPopup from './RocketPopup.jsx';

import SideNav from './SideNav.jsx';

import RightSideAd from './RightSideAd.jsx';

const Layout = ({ children }) => {
  return (
    <div className="bg-amber-50 dark:bg-gray-900 min-h-screen font-sans">
      <Header />
      <SideNav />
      <main className="lg:ml-32 lg:mr-48 container mx-auto px-6 py-12">
        {children}
      </main>
      <RightSideAd />
      <Footer />
      <RocketPopup />
    </div>
  );
};

export default Layout;
