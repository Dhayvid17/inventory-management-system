import React from "react";

//LOGIC FOR LOADING UI
export default function Loading() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    </main>
  );
}
