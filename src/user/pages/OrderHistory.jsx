import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/shared/context/AppContext';
import { useAuth } from '@/shared/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const OrderHistory = () => {
  const { orders, products } = useApp();
  const { user } = useAuth();
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [exchangeOrder, setExchangeOrder] = useState(null);

  // Format date helper
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-IN', options);
    } catch (e) {
      return dateString;
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, exchangeItem = null) => {
    if (!exchangeItem && !window.confirm(`Are you sure you want to ${newStatus === 'Cancelled' ? 'cancel' : 'return'} this order?`)) return;
    
    try {
      const token = localStorage.getItem('luxe_token');
      const payload = { status: newStatus };
      if (exchangeItem) payload.exchangeItem = exchangeItem;
      
      const res = await axios.put(`${API_BASE}/api/auth/orders/${orderId}/status`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(`Order status updated successfully!`);
        if (exchangeOrder) setExchangeOrder(null);
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to update order status`);
    }
  };

  const downloadBill = async (order) => {
    toast.info('Generating PDF bill...');
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #000;">
        <h2 style="color: #d4af37; text-align: center; letter-spacing: 2px;">LUXE GROOM</h2>
        <p style="text-align: center; color: #555; text-transform: uppercase; font-size: 12px;">Online Shopping Bill</p>
        <hr style="margin: 20px 0; border: 1px dashed #ccc;" />
        <div style="display: flex; justify-content: space-between; font-size: 14px;">
          <div><strong>Receipt #:</strong> ${order.receiptNumber}</div>
          <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
        <div style="margin-top: 10px; font-size: 14px;">
          <strong>Payment Method:</strong> ${order.paymentMethod}
        </div>
        <hr style="margin: 20px 0; border: 1px dashed #ccc;" />
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 1px solid #ccc; text-align: left;">
              <th style="padding: 8px 0;">Item</th>
              <th style="padding: 8px 0; text-align: center;">Qty</th>
              <th style="padding: 8px 0; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0;">${item.name}</td>
                <td style="padding: 8px 0; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px 0; text-align: right;">₹${item.price * item.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr style="margin: 20px 0; border: 1px dashed #ccc;" />
        <div style="text-align: right; font-size: 16px;">
          <strong>Total Paid: ₹${order.totalAmount}</strong>
        </div>
        <div style="text-align: center; font-size: 12px; color: #777; margin-top: 40px;">
          Thank you for shopping with us!
        </div>
      </div>
    `;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 10,
        filename: 'Bill-' + order.receiptNumber + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().from(element).set(opt).save();
      toast.success('Bill downloaded successfully!');
    } catch (e) {
      toast.error('Failed to generate bill');
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
                        : order.status === 'Refunded'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : order.status === 'Returned to Company'
                        ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20'
                        : order.status === 'Picked' || order.status === 'Return Requested'
                        ? 'bg-orange-400/10 text-orange-400 border border-orange-400/20'
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
              <div className="p-5 md:p-6 bg-white/2 border-t border-white/5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    order.paymentStatus === 'Paid' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Payment {order.paymentStatus || 'Paid'}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap justify-end">
                  {!['Completed', 'Delivered', 'Cancelled', 'Return/Exchange Requested'].includes(order.status) && (
                    <button
                      onClick={() => handleUpdateStatus(order.id || order._id, 'Cancelled')}
                      className="px-4 py-1.5 rounded-lg border border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      Cancel Order
                    </button>
                  )}
                  {['Completed', 'Delivered'].includes(order.status) && (
                    ((new Date() - new Date(order.updatedAt || order.createdAt)) / (1000 * 3600 * 24) <= 4) ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id || order._id, 'Return Requested')}
                          className="px-4 py-1.5 rounded-lg border border-orange-500/50 text-orange-400 text-xs font-bold hover:bg-orange-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                          Return
                        </button>
                        <button
                          onClick={() => setExchangeOrder(order)}
                          className="px-4 py-1.5 rounded-lg border border-yellow-500/50 text-yellow-400 text-xs font-bold hover:bg-yellow-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                          Exchange
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-on-surface-variant italic">Return window closed</span>
                    )
                  )}
                  <button
                    onClick={() => setTrackingOrder(order)}
                    className="px-4 py-1.5 rounded-lg border border-primary text-primary text-xs font-bold hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    Track Order
                  </button>
                  <button
                    onClick={() => downloadBill(order)}
                    className="px-4 py-1.5 rounded-lg border border-white/20 text-on-surface text-xs font-bold hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download Bill
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-on-surface-variant font-medium">Total Paid:</span>
                    <span className="text-xl md:text-2xl font-headline font-bold text-primary">
                      ₹{order.totalAmount}
                    </span>
                  </div>
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

      {/* Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTrackingOrder(null)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-high rounded-2xl w-full max-w-md relative z-10 overflow-hidden border border-white/10 shadow-2xl"
          >
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/2">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                  Track Order
                </h3>
                <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">{trackingOrder.receiptNumber}</p>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="p-1 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-8">
              <div className="relative border-l-2 border-white/10 ml-3 flex flex-col gap-8 pb-4">
                {[
                  { label: 'Order Taken', match: ['Processing', 'Taken', 'Shipped', 'Out for Delivery', 'Completed', 'Delivered'], icon: 'inventory' },
                  { label: 'Shipped', match: ['Shipped', 'Out for Delivery', 'Completed', 'Delivered'], icon: 'conveyor_belt' },
                  { label: 'Out for Delivery', match: ['Out for Delivery', 'Completed', 'Delivered'], icon: 'two_wheeler' },
                  { label: 'Completed', match: ['Completed', 'Delivered'], icon: 'check_circle' },
                ].map((step, idx) => {
                  const isCompleted = step.match.includes(trackingOrder.status);
                  const isCurrent = isCompleted && !['Completed', 'Delivered'].includes(trackingOrder.status) && trackingOrder.status === step.label; // basic visual hint
                  
                  return (
                    <div key={idx} className="relative flex items-center gap-6">
                      <div className={`absolute -left-[26px] w-12 h-12 rounded-full flex items-center justify-center border-4 border-surface-container-high z-10 ${
                        isCompleted ? 'bg-primary text-on-primary' : 'bg-surface-container border-white/10 text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                      </div>
                      <div className="ml-8">
                        <h4 className={`font-bold ${isCompleted ? 'text-on-surface' : 'text-on-surface-variant'}`}>{step.label}</h4>
                        <p className="text-[11px] text-on-surface-variant">
                          {isCompleted ? 'Completed' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-5 bg-white/2 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setTrackingOrder(null)}
                className="px-5 py-2 rounded-xl bg-white/10 text-sm font-bold hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Exchange Modal */}
      {exchangeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setExchangeOrder(null)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-high rounded-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/2 shrink-0">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">swap_horiz</span>
                  Select Item to Exchange
                </h3>
                <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">For Order #{exchangeOrder.receiptNumber}</p>
              </div>
              <button
                onClick={() => setExchangeOrder(null)}
                className="p-1 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-surface">
              <p className="text-sm text-on-surface-variant mb-6">Please select a product you would like to exchange with from our shop.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products && products.length > 0 ? (
                  products.map(product => (
                    <div 
                      key={product.id || product._id}
                      className="bg-surface-container border border-white/5 p-4 rounded-xl flex gap-4 items-center hover:border-primary/50 transition-colors group"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white/5">
                        <img 
                          src={product.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=200&auto=format&fit=crop'} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-on-surface mb-1">{product.name}</h4>
                        <p className="text-primary font-bold text-sm">₹{product.price}</p>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus(exchangeOrder.id || exchangeOrder._id, 'Exchange Requested', { productId: product.id || product._id, name: product.name })}
                        className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary text-xs font-bold rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        Select
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-10 text-center text-on-surface-variant">
                    No products available in the shop right now.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
