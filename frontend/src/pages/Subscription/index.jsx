import { ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SubscriptionPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-white px-6 py-16 text-slate-900">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg">
          <CreditCard size={28} />
        </div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">SyncSpace plans</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Subscription is coming soon</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-500">We’re preparing flexible plans for teams. Your workspace remains available while subscriptions are being finished.</p>
        <Link to="/dashboard" className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
