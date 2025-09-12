import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface StarRatingProps {
  currentRating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  currentRating,
  onRatingChange,
  maxRating = 5,
  size = 'md',
  readonly = false,
  className
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
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

  return (
    <div className={cn('flex items-center space-x-0.5', className)}>
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
          <Star
            className={cn(
              sizeClasses[size],
              getStarColor(index),
              'transition-colors duration-150'
            )}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;

