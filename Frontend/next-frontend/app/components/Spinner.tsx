import React from "react";

//LOGIC TO DISPLAY SPINNER WHEN DATA IS LOADING
const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
};

export default Spinner;
