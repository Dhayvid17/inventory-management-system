import Link from "next/link";
import React from "react";

//LOGIC TO DISPLAY NOT-FOUND PAGE
const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="text-[150px] font-bold text-gray-300 leading-none">
            404
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Oops! Staff Assignment not found
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          The staff assignment you're looking for doesn't exist. Let's get you
          back on track!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/staff-assignments"
            className="flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-950 transition-colors duration-200"
          >
            Return To All Staff Assignments
          </Link>
        </div>
      </div>
    </div>
  );
};
export default NotFound;