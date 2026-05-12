import React from 'react';
import { SimulationEngine } from '../dss/simulation/SimulationEngine';

export default function Prediction() {
  return (
    <div className="min-h-screen bg-ink text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <SimulationEngine />
      </div>
    </div>
  );
}

