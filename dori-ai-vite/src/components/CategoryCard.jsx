// src/components/CategoryCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

const CategoryCard = ({ title, description, href, icon }) => {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.05, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer p-8 block"
    >
      <div className="flex items-center mb-4">
        <div className="text-3xl mr-4">{icon}</div>
        <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </motion.a>
  );
};

export default CategoryCard;
