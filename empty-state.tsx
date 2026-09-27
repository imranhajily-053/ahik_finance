import { Inbox } from "lucide-react";

export function EmptyState({ message = "Bu seçim üzrə məlumat tapılmadı" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-brand-400">
      <Inbox size={32} className="mb-3 opacity-60" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16 text-brand-400 text-sm">
      Yüklənir...
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-negative">
      <p className="text-sm mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm underline underline-offset-2">
          Yenidən cəhd et
        </button>
      )}
    </div>
  );
}
