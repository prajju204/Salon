import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden font-body">
      {/* Premium ambient light spots */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
