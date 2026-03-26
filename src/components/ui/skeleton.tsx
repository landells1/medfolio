import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-surface-200/60',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function ChecklistSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-12 rounded-full ml-2" />
      </div>
      <div className="border-t border-surface-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-surface-50">
            <Skeleton className="w-6 h-6 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-36" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex items-center gap-2 pt-2 border-t border-surface-100">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card p-6">
          <Skeleton className="h-5 w-36 mb-6" />
          <div className="flex gap-8 justify-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-[100px] h-[100px] rounded-full" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 card p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-3">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
