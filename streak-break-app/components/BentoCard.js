import React from "react";

export default function BentoCard({ title, value, emoji }) {
  return (
    <div className="bg-white shadow rounded p-4 w-40 text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-gray-500">{title}</div>
    </div>
  );
}
