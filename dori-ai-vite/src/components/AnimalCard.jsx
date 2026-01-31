// src/components/AnimalCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

const AnimalCard = ({ name, image, description }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
    >
      <img src={image} alt={name} className="w-full h-48 object-cover" />
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{name}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </motion.div>
  );
};

export default AnimalCard;
