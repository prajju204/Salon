import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/shared/context/AppContext';
import { useAuth } from '@/shared/context/AuthContext';

const OrderHistory = () => {
  const { orders } = useApp();
  const { user } = useAuth();

  // Format date helper
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-IN', options);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-2">Order History</h1>
        <p className="text-on-surface-variant text-label-md">
          Track and manage your grooming product orders, view invoices, and check shipping status.
        </p>
      </div>

      {orders && orders.length > 0 ? (
        <div className="flex flex-col gap-6">
          {orders.map((order, idx) => (
            <motion.div
              key={order.id || order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden hover:border-primary/20 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
            >
              {/* Header Info */}
              <div className="p-5 md:p-6 border-b border-white/5 bg-white/2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">
                    Receipt #
                  </span>
                  <span className="font-mono text-sm font-bold text-primary">
                    {order.receiptNumber || 'N/A'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">
                      Date Placed
                    </span>
                    <span className="text-sm font-semibold text-on-surface">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">
                      Payment Method
                    </span>
                    <span className="text-sm font-semibold text-on-surface">
                      {order.paymentMethod}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">
                      Status
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase text-center tracking-wider w-fit ${
                      order.status === 'Completed' || order.status === 'Delivered'
                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                        : order.status === 'Shipped'
                        ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {order.status || 'Processing'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="p-5 md:p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-4 divide-y divide-white/5">
                  {order.items && order.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex gap-4 pt-4 first:pt-0 items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-container-high border border-white/5 shrink-0">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-sm sm:text-base">
                            {item.name}
                          </h4>
                          <p className="text-xs text-on-surface-variant">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-headline font-bold text-on-surface text-sm sm:text-base">
                          ₹{item.price * item.quantity}
                        </span>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-on-surface-variant">
                            (₹{item.price} each)
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Total */}
              <div className="p-5 md:p-6 bg-white/2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    order.paymentStatus === 'Paid' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Payment {order.paymentStatus || 'Paid'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-on-surface-variant font-medium">Total Paid:</span>
                  <span className="text-xl md:text-2xl font-headline font-bold text-primary">
                    ₹{order.totalAmount}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container rounded-3xl border border-white/5 text-center px-6">
          <span className="material-symbols-outlined text-6xl text-primary/45 mb-4">receipt_long</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">No Orders Found</h3>
          <p className="text-on-surface-variant text-sm max-w-md mb-8">
            Looks like you haven't purchased any premium grooming items yet. Visit our grooming shop to get started!
          </p>
          <a
            href="/shop"
            className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            Go to Shop
          </a>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
