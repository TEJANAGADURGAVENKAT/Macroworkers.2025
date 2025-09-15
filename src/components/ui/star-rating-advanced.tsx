import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  currentRating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  readonly?: boolean;
  showLabel?: boolean;
  showValue?: boolean;
  allowHalfStars?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  currentRating,
  onRatingChange,
  maxRating = 5,
  size = 'md',
  readonly = false,
  showLabel = false,
  showValue = false,
  allowHalfStars = false,
  className,
  label,
  error
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [hoveredHalf, setHoveredHalf] = useState<boolean>(false);

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const handleStarClick = useCallback((rating: number) => {
    if (!readonly) {
      onRatingChange(rating);
    }
  }, [readonly, onRatingChange]);

  const handleStarHover = useCallback((rating: number, isHalf: boolean = false) => {
    if (!readonly) {
      setHoveredRating(rating);
      setHoveredHalf(isHalf);
    }
  }, [readonly]);

  const handleStarLeave = useCallback(() => {
    if (!readonly) {
      setHoveredRating(null);
      setHoveredHalf(false);
    }
  }, [readonly]);

  const getStarColor = (starIndex: number, isHalf: boolean = false) => {
    const rating = hoveredRating || currentRating;
    const isHoveredHalf = hoveredHalf && hoveredRating === starIndex + 1;
    
    if (isHalf && isHoveredHalf) {
      return 'text-yellow-400';
    }
    
    if (starIndex < Math.floor(rating)) {
      return 'text-yellow-400';
    }
    
    if (starIndex === Math.floor(rating) && rating % 1 !== 0) {
      return 'text-yellow-400';
    }
    
    return 'text-gray-300';
  };

  const getStarIcon = (starIndex: number) => {
    const rating = hoveredRating || currentRating;
    const isFilled = starIndex < Math.floor(rating);
    const isHalfFilled = starIndex === Math.floor(rating) && rating % 1 !== 0;
    const isHoveredHalf = hoveredHalf && hoveredRating === starIndex + 1;
    
    if (allowHalfStars && (isHalfFilled || isHoveredHalf)) {
      return (
        <StarHalf
          className={cn(
            sizeClasses[size],
            getStarColor(starIndex, true),
            'transition-colors duration-150 fill-current'
          )}
        />
      );
    }
    
    return (
      <Star
        className={cn(
          sizeClasses[size],
          getStarColor(starIndex),
          'transition-colors duration-150',
          (isFilled || isHalfFilled) ? 'fill-current' : 'fill-none'
        )}
      />
    );
  };

  const getRatingText = () => {
    if (currentRating === 0) return 'Not rated';
    if (allowHalfStars && currentRating % 1 !== 0) {
      return `${currentRating}/${maxRating}`;
    }
    return `${Math.floor(currentRating)}/${maxRating}`;
  };

  const getRatingDescription = () => {
    const rating = Math.floor(currentRating);
    const descriptions = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return descriptions[rating as keyof typeof descriptions] || '';
  };

  return (
    <div className={cn('flex flex-col space-y-1', className)}>
      {label && (
        <label className={cn('text-sm font-medium text-foreground', textSizeClasses[size])}>
          {label}
        </label>
      )}
      
      <div className="flex items-center space-x-1">
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
        
        {showValue && (
          <span className={cn('ml-2 font-medium text-foreground', textSizeClasses[size])}>
            {getRatingText()}
          </span>
        )}
        
        {showLabel && currentRating > 0 && (
          <span className={cn('ml-2 text-muted-foreground', textSizeClasses[size])}>
            {getRatingDescription()}
          </span>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default StarRating;

