import React, { useState } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface AnimatedButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  animationType?: 'pulse' | 'bounce' | 'scale' | 'slide';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onClick,
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  animationType = 'scale'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (disabled || loading) return;
    
    setIsAnimating(true);
    onClick();
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const baseClasses = 'relative overflow-hidden font-medium rounded-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white focus:ring-purple-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white focus:ring-green-500',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const animationClasses = {
    pulse: isAnimating ? 'animate-pulse' : '',
    bounce: isAnimating ? 'animate-bounce' : '',
    scale: isAnimating ? 'transform scale-95' : 'hover:scale-105',
    slide: isAnimating ? 'transform translate-x-1' : ''
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${animationClasses[animationType]}
        ${disabledClasses}
        ${className}
      `}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
        </div>
      )}
      
      <div className={`flex items-center ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {Icon && <Icon className="h-5 w-5 mr-2" />}
        {children}
      </div>

      {/* Ripple effect */}
      {isAnimating && (
        <div className="absolute inset-0 bg-white opacity-20 rounded-lg animate-ping"></div>
      )}
    </button>
  );
};

export default AnimatedButton;