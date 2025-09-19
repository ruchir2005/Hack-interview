'use client';

import { useEffect } from 'react';

const NeuralBackground = () => {
  useEffect(() => {
    // Additional dynamic connections can be added here
  }, []);

  return (
    <div className="neural-container">
      {/* Static neural nodes */}
      <div className="neural-node" style={{ top: '20%', left: '15%', animationDelay: '0s' }}></div>
      <div className="neural-node" style={{ top: '40%', left: '25%', animationDelay: '1s' }}></div>
      <div className="neural-node" style={{ top: '60%', left: '35%', animationDelay: '2s' }}></div>
      <div className="neural-node" style={{ top: '30%', right: '20%', animationDelay: '0.5s' }}></div>
      <div className="neural-node" style={{ top: '70%', right: '30%', animationDelay: '1.5s' }}></div>
      <div className="neural-node" style={{ top: '50%', left: '50%', animationDelay: '2.5s' }}></div>
      
      {/* Neural connections */}
      <div className="neural-connection" style={{ 
        top: '20%', left: '15%', width: '200px', 
        transform: 'rotate(25deg)', animationDelay: '0s' 
      }}></div>
      <div className="neural-connection" style={{ 
        top: '40%', left: '25%', width: '150px', 
        transform: 'rotate(-15deg)', animationDelay: '1s' 
      }}></div>
      <div className="neural-connection" style={{ 
        top: '60%', left: '35%', width: '180px', 
        transform: 'rotate(45deg)', animationDelay: '2s' 
      }}></div>
    </div>
  );
};

export default NeuralBackground;
