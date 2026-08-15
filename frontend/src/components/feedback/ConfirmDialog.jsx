import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm action',
  destructive = false,
  isSubmitting = false,
  onConfirm,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#181924] p-6 shadow-2xl shadow-black/60 focus:outline-none">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${destructive ? 'bg-red-400/10 text-red-300' : 'bg-amber-300/10 text-amber-200'}`}>
            <AlertTriangle size={20} />
          </div>
          <Dialog.Title className="mt-5 text-lg font-bold text-white">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-white/50">{description}</Dialog.Description>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button type="button" disabled={isSubmitting} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50">
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onConfirm}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-white text-[#151620] hover:bg-violet-100'}`}
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />} {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
