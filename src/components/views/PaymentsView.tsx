import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Upload, CreditCard, ChevronRight } from 'lucide-react';
import { UserProfile, StripeInvoice, StripeSubscription, Payment } from '../../types';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface PaymentsViewProps {
  profile: UserProfile | null;
  invoices: StripeInvoice[];
  subscriptions: StripeSubscription[];
  payments: Payment[];
  onCreateSub: (priceId: string) => void;
  onCancelSub: (subscriptionId: string) => void;
  onUploadProof: () => void;
}

export const PaymentsView = ({ 
  profile, 
  invoices, 
  subscriptions,
  payments,
  onCreateSub,
  onCancelSub,
  onUploadProof
}: PaymentsViewProps) => {
  const activeSub = subscriptions.find(s => s.status === 'active') || 
                    (profile?.stripe_subscription_id ? { id: profile.stripe_subscription_id, status: 'active' } : null);
  
  const amountToPay = profile?.plan_price ? parseFloat(profile.plan_price) : 45;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="text-center py-10">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
          activeSub || profile?.is_active ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
        )}>
          {activeSub || profile?.is_active ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
        </div>
        <h3 className="text-2xl font-bold text-zinc-900">
          {profile?.is_active ? 'Tu cuenta está activa' : 'Cuenta inactiva'}
        </h3>
        
        <div className="mt-4 space-y-1">
          <p className="text-lg font-semibold text-zinc-900">
            {profile?.plan_name || 'Plan Premium'}
          </p>
          <p className="text-3xl font-bold text-zinc-900">
            ${amountToPay.toFixed(2)}
            <span className="text-sm text-zinc-500 font-normal">/mes</span>
          </p>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto">
            {profile?.plan_details || 'Acceso completo a nutrición y entrenamiento (Suscripción mensual)'}
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-100 grid grid-cols-3 gap-4">
          <div className="text-left">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-widest">Estado</p>
            <p className="font-bold text-sm capitalize">{profile?.is_active ? 'Activa' : 'Inactiva'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-widest">Vencimiento</p>
            <p className="font-bold text-sm">
              {profile?.membership_expires_at 
                ? new Date(profile.membership_expires_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : profile?.is_active ? '30 días' : '--'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-widest">Monto</p>
            <p className="font-bold text-sm">${amountToPay.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {activeSub ? (
            <button 
              onClick={() => onCancelSub(activeSub.id)}
              className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <AlertCircle size={20} />
              Cancelar Suscripción Automática
            </button>
          ) : (
            <button 
              onClick={() => onCreateSub('premium_monthly')}
              className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              <CreditCard size={20} />
              Suscribirse con Tarjeta (Visa/Mastercard)
            </button>
          )}

          <button 
            onClick={onUploadProof}
            className="w-full py-4 bg-zinc-50 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            Enviar Comprobante Manual (Yappy/Transferencia)
          </button>
        </div>
      </Card>

      {payments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Historial de Pagos</h3>
          <div className="space-y-3">
            {payments.map(payment => (
              <div key={payment.id} className="bg-white p-4 rounded-2xl border border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    payment.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                    payment.status === 'rejected' ? "bg-red-50 text-red-600" :
                    "bg-amber-50 text-amber-600"
                  )}>
                    {payment.status === 'completed' ? <CheckCircle2 size={18} /> :
                     payment.status === 'rejected' ? <AlertCircle size={18} /> :
                     <Clock size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      {payment.method} - ${payment.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(payment.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                    payment.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                    payment.status === 'rejected' ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {payment.status === 'completed' ? 'Completado' :
                     payment.status === 'rejected' ? 'Rechazado' :
                     'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Facturas Recientes</h3>
        <div className="space-y-2">
          {invoices.length > 0 ? invoices.map(invoice => (
            <div key={invoice.id} className="flex items-center justify-between p-3 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="text-zinc-400" />
                <span className="text-sm font-medium">Factura #{invoice.id?.slice(-6) || '...'} - {new Date(invoice.created).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold">${(invoice.amount_due / 100).toFixed(2)}</span>
                <a 
                  href={invoice.invoice_pdf} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900"
                >
                  PDF <ChevronRight size={14} />
                </a>
              </div>
            </div>
          )) : (
            <p className="text-sm text-zinc-400 italic p-4 text-center">No hay facturas registradas.</p>
          )}
        </div>
      </div>
    </div>
  );
};
