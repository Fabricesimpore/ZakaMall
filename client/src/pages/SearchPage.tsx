import React from "react";
import AdvancedSearch from "@/components/AdvancedSearch";
import Navbar from "@/components/Navbar";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdvancedSearch />
    </div>
  );
}