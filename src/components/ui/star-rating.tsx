import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  currentRating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showLabel?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  currentRating,
  onRatingChange,
  maxRating = 5,
  size = 'md',
  readonly = false,
  showLabel = false,
  className
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4 text-sm',
    md: 'w-5 h-5 text-base',
    lg: 'w-6 h-6 text-lg'
  };

  const handleStarClick = (rating: number) => {
    if (!readonly) {
      onRatingChange(rating);
    }
  };

  const handleStarHover = (rating: number) => {
    if (!readonly) {
      setHoveredRating(rating);
    }
  };

  const handleStarLeave = () => {
    if (!readonly) {
      setHoveredRating(null);
    }
  };

  const getStarColor = (starIndex: number) => {
    const rating = hoveredRating || currentRating;
    
    if (starIndex < rating) {
      return 'text-yellow-400 fill-yellow-400';
    }
    return 'text-gray-300 fill-gray-300';
  };

  const getStarIcon = (starIndex: number) => {
    const rating = hoveredRating || currentRating;
    
    if (starIndex < rating) {
      return (
        <svg
          className={cn(sizeClasses[size], getStarColor(starIndex), 'transition-colors duration-150')}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
    
    return (
      <svg
        className={cn(sizeClasses[size], getStarColor(starIndex), 'transition-colors duration-150')}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: maxRating }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(index + 1)}
            onMouseEnter={() => handleStarHover(index + 1)}
            onMouseLeave={handleStarLeave}
            disabled={readonly}
            className={cn(
              'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 rounded-sm',
              !readonly && 'hover:scale-110 cursor-pointer',
              readonly && 'cursor-default'
            )}
            aria-label={`Rate ${index + 1} star${index + 1 > 1 ? 's' : ''}`}
          >
            {getStarIcon(index)}
          </button>
        ))}
      </div>
      
      {showLabel && (
        <span className="ml-2 text-sm text-muted-foreground">
          {currentRating > 0 ? `${currentRating}/${maxRating}` : 'Not rated'}
        </span>
      )}
    </div>
  );
};

export default StarRating;

