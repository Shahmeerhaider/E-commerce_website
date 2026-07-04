import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, applyCoupon as applyCouponAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PAYMENT_METHODS = [
  { value: 'COD',       label: 'Cash on Delivery',  desc: 'Pay when your order arrives' },
  { value: 'Stripe',    label: 'Credit / Debit Card',desc: 'Pay securely via Stripe'     },
  { value: 'EasyPaisa', label: 'EasyPaisa',          desc: 'Pay via EasyPaisa wallet'    },
  { value: 'JazzCash',  label: 'JazzCash',           desc: 'Pay via JazzCash wallet'     },
];

const Checkout = () => {
  const { cartItems, total, clearItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step,          setStep]          = useState(1);
  const [address,       setAddress]       = useState({
    street: '', city: '', state: '', zip: '', country: 'Pakistan', paymentNumber: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading,       setLoading]       = useState(false);
  const [couponInput,   setCouponInput]   = useState('');
  const [coupon,        setCoupon]        = useState({ code: '', discount: 0, applied: false });

  const shipping   = total > 5000 ? 0 : 200;
  const tax        = Math.round(total * 0.05);
  const grandTotal = Math.max(0, total + shipping + tax - coupon.discount);

  const validateAddress = () => {
    const { street, city, state, zip } = address;
    if (!street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      toast.error('Please fill in all shipping details');
      return false;
    }
    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const res = await applyCouponAPI({ code: couponInput.trim(), orderAmount: total });
      setCoupon({ code: res.data.code, discount: res.data.discount, applied: true });
      toast.success(`Coupon applied! You save PKR ${res.data.discount.toLocaleString()}`);
    } catch (err) {
      toast.error(err.message || 'Invalid coupon');
      setCoupon({ code: '', discount: 0, applied: false });
    }
  };

  const removeCoupon = () => {
    setCoupon({ code: '', discount: 0, applied: false });
    setCouponInput('');
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const getImage = (images) => {
        if (!images?.length) return '';
        const img = images[0];
        return typeof img === 'string' ? img : img?.url || '';
      };

      const orderData = {
        orderItems: cartItems.map(i => ({
          product:  i._id,
          name:     i.name,
          image:    getImage(i.images),
          price:    i.discountPrice || i.price,
          quantity: i.quantity,
          seller:   i.seller,
        })),
        shippingAddress: address,
        paymentMethod,
        itemsPrice:   total,
        shippingPrice:shipping,
        taxPrice:     tax,
        totalPrice:   grandTotal,
        couponCode:   coupon.applied ? coupon.code : undefined,
        paymentDetails:
          paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash'
            ? address.paymentNumber
            : 'N/A',
      };

      const res = await createOrder(orderData);
      clearItems();
      toast.success('Order placed successfully!');
      navigate(`/orders/${res.data._id}`);
    } catch (err) {
      toast.error(err.message || 'Order failed');
    }
    setLoading(false);
  };

  return (
    <div className="checkout-page">

      {/* ── Steps indicator ─────────────────────────────────── */}
      <div className="checkout-steps">
        {['Shipping', 'Payment', 'Review'].map((label, i) => (
          <div key={label} className={`step ${step >= i + 1 ? 'active' : ''}`}>
            <span style={styles.stepNum}>{i + 1}</span>
            {label}
          </div>
        ))}
      </div>

      <div className="checkout-layout">

        {/* ── LEFT: form steps ────────────────────────────────── */}
        <div className="checkout-form">

          {/* STEP 1 — Shipping */}
          {step === 1 && (
            <div className="step-content">
              <h2>Shipping Address</h2>
              <div style={styles.formGrid}>
                {[
                  { key: 'street',  placeholder: 'Street Address', full: true  },
                  { key: 'city',    placeholder: 'City'                         },
                  { key: 'state',   placeholder: 'State / Province'             },
                  { key: 'zip',     placeholder: 'Postal Code'                  },
                  { key: 'country', placeholder: 'Country'                      },
                ].map(({ key, placeholder, full }) => (
                  <input
                    key={key}
                    placeholder={placeholder}
                    value={address[key]}
                    onChange={e => setAddress(p => ({ ...p, [key]: e.target.value }))}
                    required
                    style={full ? { gridColumn: '1 / -1' } : {}}
                  />
                ))}
              </div>
              <button
                className="btn-primary"
                onClick={() => validateAddress() && setStep(2)}
                style={styles.fullBtn}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* STEP 2 — Payment */}
          {step === 2 && (
            <div className="step-content">
              <h2>Payment Method</h2>

              {/* ── Radio buttons — FIXED alignment ── */}
             <div style={styles.paymentList}>
  {PAYMENT_METHODS.map(m => (
    <div
      key={m.value}
      onClick={() => setPaymentMethod(m.value)}
      style={{
        display:        'flex',
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'flex-start',
        gap:            '14px',
        padding:        '14px 16px',
        border:         paymentMethod === m.value
                          ? '1.5px solid #0d1822'
                          : '1.5px solid #e8e8e8',
        borderRadius:   '8px',
        cursor:         'pointer',
        background:     paymentMethod === m.value ? '#f9f7f4' : '#ffffff',
        transition:     'all 0.2s ease',
        userSelect:     'none',
        boxSizing:      'border-box',
      }}
    >
      {/* Radio circle */}
      <div
        style={{
          width:           '18px',
          height:          '18px',
          minWidth:        '18px',
          minHeight:       '18px',
          borderRadius:    '50%',
          border:          paymentMethod === m.value
                             ? '2px solid #0d1822'
                             : '2px solid #aaaaaa',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
          backgroundColor: '#ffffff',
        }}
      >
        {paymentMethod === m.value && (
          <div
            style={{
              width:           '9px',
              height:          '9px',
              borderRadius:    '50%',
              backgroundColor: '#0d1822',
            }}
          />
        )}
      </div>

      {/* Text */}
      <div
        style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           '2px',
          flex:          1,
        }}
      >
        <span
          style={{
            fontSize:   '0.9rem',
            fontWeight: 600,
            color:      '#0d1822',
            lineHeight: 1.3,
          }}
        >
          {m.label}
        </span>
        <span
          style={{
            fontSize:   '0.75rem',
            color:      '#999999',
            lineHeight: 1.3,
          }}
        >
          {m.desc}
        </span>
      </div>
    </div>
  ))}
</div>

              {/* Mobile payment number input */}
              {(paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash') && (
                <div style={styles.mobileInput}>
                  <label style={styles.mobileLabel}>{paymentMethod} Account Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 03001234567"
                    value={address.paymentNumber}
                    onChange={e => setAddress(p => ({ ...p, paymentNumber: e.target.value }))}
                    required
                  />
                </div>
              )}

              <div className="btn-group" style={styles.btnGroup}>
                <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (
                      (paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash') &&
                      !address.paymentNumber.trim()
                    ) {
                      toast.error(`Please enter your ${paymentMethod} number`);
                      return;
                    }
                    setStep(3);
                  }}
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="step-content">
              <h2>Review Order</h2>

              <div className="review-address">
                <p style={styles.reviewLabel}>Delivery Address</p>
                <p>{address.street}, {address.city}, {address.state} {address.zip}, {address.country}</p>
                {(paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash') && (
                  <p style={{ marginTop: 4 }}>
                    <strong>Payment Account:</strong> {address.paymentNumber}
                  </p>
                )}
              </div>

              <div className="review-payment" style={{ marginBottom: 16 }}>
                <p style={styles.reviewLabel}>Payment Method</p>
                <p>{PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}</p>
              </div>

              <div style={styles.reviewItems}>
                {cartItems.map(i => (
                  <div key={i._id} className="review-item">
                    <span>{i.name} × {i.quantity}</span>
                    <span>PKR {((i.discountPrice || i.price) * i.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="btn-group" style={styles.btnGroup}>
                <button className="btn-ghost" onClick={() => setStep(2)}>Back</button>
                <button
                  className="btn-primary"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? 'Placing Order…' : `Place Order — PKR ${grandTotal.toLocaleString()}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: order summary ─────────────────────────────── */}
        <div className="order-summary-box">
          <h3>Order Summary</h3>

          {/* Items */}
          <div style={styles.summaryItems}>
            {cartItems.map(i => (
              <div key={i._id} className="summary-item">
                <span style={{ color: '#555' }}>{i.name} × {i.quantity}</span>
                <span>PKR {((i.discountPrice || i.price) * i.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <hr />

          {/* Coupon */}
          <div style={styles.couponSection}>
            {coupon.applied ? (
              <div style={styles.couponApplied}>
                <span style={{ fontSize: '0.85rem', color: '#2d7a56', fontWeight: 600 }}>
                  {coupon.code} applied — saving PKR {coupon.discount.toLocaleString()}
                </span>
                <button
                  className="btn-link"
                  onClick={removeCoupon}
                  style={{ fontSize: '0.78rem', marginLeft: 'auto' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={styles.couponRow}>
                <input
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  style={{ marginBottom: 0, flex: 1, fontSize: '0.85rem' }}
                />
                <button
                  className="btn-ghost btn-sm"
                  onClick={handleApplyCoupon}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <hr />

          {/* Totals */}
          <div className="summary-row"><span>Subtotal</span><span>PKR {total.toLocaleString()}</span></div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : `PKR ${shipping}`}</span>
          </div>
          <div className="summary-row"><span>Tax (5%)</span><span>PKR {tax.toLocaleString()}</span></div>
          {coupon.applied && (
            <div className="summary-row" style={{ color: '#2d7a56' }}>
              <span>Discount ({coupon.code})</span>
              <span>− PKR {coupon.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="summary-row total">
            <strong>Total</strong>
            <strong>PKR {grandTotal.toLocaleString()}</strong>
          </div>

          {total > 0 && total <= 5000 && (
            <p style={styles.freeShippingNote}>
              Add PKR {(5000 - total).toLocaleString()} more for free shipping
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = {
  // Steps
  stepNum: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 22, height: 22, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', fontSize: '0.7rem',
    fontWeight: 700, marginRight: 8,
  },

  // Form grid
  formGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20,
  },

  fullBtn: { width: '100%', marginTop: 4 },

  // Payment radio list
  paymentList: {
    display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20,
  },

  // ── FIXED radio label ──
  radioLabel: {
    display:      'flex',
    alignItems:   'center',      // vertically center everything
    gap:          14,
    padding:      '14px 16px',
    border:       '1.5px solid #e8e8e8',
    borderRadius: 8,
    cursor:       'pointer',
    transition:   'all 0.2s',
    background:   '#fff',
    userSelect:   'none',
  },
  radioLabelActive: {
    borderColor: '#0d1822',
    background:  '#f9f7f4',
  },

  // Custom radio circle — always same size, never stretches
  radioOuter: {
    width:          18,
    height:         18,
    minWidth:       18,          // prevents shrinking
    borderRadius:   '50%',
    border:         '2px solid #0d1822',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,           // never shrink
  },
  radioInner: {
    width:        9,
    height:       9,
    borderRadius: '50%',
    background:   '#0d1822',
  },

  // Radio text block
  radioText: {
    display:       'flex',
    flexDirection: 'column',
    gap:           2,
  },
  radioTitle: {
    fontSize:   '0.9rem',
    fontWeight: 600,
    color:      '#0d1822',
  },
  radioDesc: {
    fontSize: '0.75rem',
    color:    '#999',
  },

  // Mobile payment input
  mobileInput: { marginBottom: 20 },
  mobileLabel: {
    display:        'block',
    fontSize:       '0.75rem',
    fontWeight:     600,
    textTransform:  'uppercase',
    letterSpacing:  '0.1em',
    color:          '#888',
    marginBottom:   8,
  },

  // Button group
  btnGroup: { display: 'flex', gap: 10, marginTop: 8 },

  // Review
  reviewLabel: {
    fontSize:       '0.68rem',
    fontWeight:     700,
    textTransform:  'uppercase',
    letterSpacing:  '0.12em',
    color:          '#aaa',
    marginBottom:   5,
  },
  reviewItems: { marginBottom: 16 },

  // Summary
  summaryItems: { marginBottom: 12 },

  // Coupon
  couponSection: { margin: '14px 0' },
  couponApplied: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#edf7f2', padding: '10px 12px', borderRadius: 6,
    border: '1px solid #b7e4ce',
  },
  couponRow: { display: 'flex', gap: 8, alignItems: 'center' },

  // Free shipping note
  freeShippingNote: {
    fontSize:    '0.75rem',
    color:       '#c4963c',
    textAlign:   'center',
    marginTop:   12,
    padding:     '8px',
    background:  '#fef9ec',
    borderRadius:4,
  },
};