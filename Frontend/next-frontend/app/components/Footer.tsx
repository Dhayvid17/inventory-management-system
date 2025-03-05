import React from "react";

//LOGIC FOR FOOTER
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white text-center p-4">
      <p>
        &copy; {new Date().getFullYear()} Inventory Management System. All
        rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
