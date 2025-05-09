import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-4 text-center text-gray-500 text-sm">
      © {currentYear} NeuroSync Project
    </footer>
  );
};

export default Footer;