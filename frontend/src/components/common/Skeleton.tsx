import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full", height, width }) => {
  return (
    <div
      className={`animate-pulse bg-slate-700/50 rounded ${className}`}
      style={{ height, width }}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
};
