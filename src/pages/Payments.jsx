import { useEffect, useState, useCallback } from "react";
import { Search, Download } from "lucide-react";
import api from "../api/axios";
import "../styles/Payments.css";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.get("/payments");
      if (res.data.success) setPayments(res.data.data || res.data.payments || []);
      else if (Array.isArray(res.data)) setPayments(res.data);
    } catch (e) {
      setMessage(e.response?.data?.message || "Unable to connect");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await fetchPayments();
    };
    load();
    return () => { mounted = false; };
  }, [fetchPayments]);

  const filtered = payments.filter((p) => {
    const search = (p.user_name || "").toLowerCase().includes(filter.toLowerCase()) ||
                   String(p.id).includes(filter) ||
                   (p.transaction_id || "").toLowerCase().includes(filter.toLowerCase());
    const st = (p.payment_status || "").toLowerCase();
    const matchStatus = statusFilter === "all" || st === statusFilter;
    return search && matchStatus;
  });

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const completed = payments.filter((p) => ["completed","success","paid"].includes((p.payment_status || "").toLowerCase())).length;
  const pending = payments.length - completed;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRevenue = payments.filter(p => (p.payment_date || "").startsWith(todayStr)).reduce((s,p)=>s+Number(p.amount||0),0);

  if (loading) {
    return (
      <div className="payments-page">
        <div className="payments-loading">
          <div className="loading-spinner"></div>
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div>
          <h1>Payments</h1>
          <p>₹{totalRevenue.toLocaleString('en-IN')} total revenue • {payments.length} transactions</p>
        </div>
        <button className="payment-count" onClick={() => {}} style={{cursor:'pointer',border:'none'}}>
          <Download size={14}/> <span>{payments.length}</span> Export
        </button>
      </div>

      {/* STATS - Like your screenshot top 4 cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'22px'}}>
        <div style={{background:'#F0F4FF',border:'1px solid #D9E2FF',borderRadius:'14px',padding:'16px'}}>
          <span style={{fontSize:'11px',fontWeight:600,color:'#64748B'}}>Total Revenue</span>
          <div style={{fontSize:'22px',fontWeight:800,color:'#0F172A',marginTop:'4px'}}>₹{totalRevenue.toLocaleString('en-IN')}</div>
          <small style={{fontSize:'11px',color:'#2563EB'}}>+12% this month ▲</small>
        </div>
        <div style={{background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:'14px',padding:'16px'}}>
          <span style={{fontSize:'11px',fontWeight:600,color:'#64748B'}}>Completed</span>
          <div style={{fontSize:'22px',fontWeight:800,color:'#0F172A',marginTop:'4px'}}>{completed}</div>
          <small style={{fontSize:'11px',color:'#16A34A'}}>Successful payments</small>
        </div>
        <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'14px',padding:'16px'}}>
          <span style={{fontSize:'11px',fontWeight:600,color:'#64748B'}}>Pending</span>
          <div style={{fontSize:'22px',fontWeight:800,color:'#0F172A',marginTop:'4px'}}>{pending}</div>
          <small style={{fontSize:'11px',color:'#D97706'}}>Awaiting confirmation</small>
        </div>
        <div style={{background:'#FAF5FF',border:'1px solid #E9D5FF',borderRadius:'14px',padding:'16px'}}>
          <span style={{fontSize:'11px',fontWeight:600,color:'#64748B'}}>Today</span>
          <div style={{fontSize:'22px',fontWeight:800,color:'#0F172A',marginTop:'4px'}}>₹{todayRevenue}</div>
          <small style={{fontSize:'11px',color:'#9333EA'}}>Today's collection</small>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',width:'100%',maxWidth:'320px',height:'40px',padding:'0 14px',background:'#fff',border:'1px solid #E2E8F0',borderRadius:'10px'}}>
          <Search size={16} style={{color:'#94A3B8'}}/>
          <input placeholder="Search user, transaction ID" value={filter} onChange={e=>setFilter(e.target.value)} style={{border:'none',outline:'none',width:'100%',fontSize:'13px',background:'transparent'}}/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{height:'40px',padding:'0 12px',background:'#fff',border:'1px solid #E2E8F0',borderRadius:'10px',fontSize:'13px'}}>
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {message && <div className="payments-message">{message}</div>}

      <div className="payments-section">
        <div className="payments-section-header">
          <h2>All Payments</h2>
          <span>{filtered.length}</span>
        </div>

        {filtered.length===0? (
          <div className="payments-empty">
            <div className="empty-payment-icon">₹</div>
            <h3>No Payments Found</h3>
            <p>No payment records match your search.</p>
          </div>
        ) : (
          <div className="payments-grid">
            {filtered.map(p => {
              const st = (p.payment_status || "pending").toLowerCase();
              return (
              <div className="payment-card" key={p.id}>
                <div className="payment-card-header">
                  <div className="payment-icon">₹</div>
                  <div>
                    <h3>#{p.id} {p.transaction_id || `TXN00${p.id}`}</h3>
                    <span className="payment-date">{p.payment_date? new Date(p.payment_date).toLocaleDateString('en-IN') : "-"}</span>
                  </div>
                </div>
                <div className="payment-amount">₹{Number(p.amount||0).toLocaleString('en-IN')}</div>
                <div className="payment-details">
                  <div className="payment-detail-row"><span>Player</span><strong>{p.user_name || "N/A"}</strong></div>
                  <div className="payment-detail-row"><span>Method</span><strong>{p.payment_method || "UPI"}</strong></div>
                  <div className="payment-detail-row"><span>Booking</span><strong>#{p.booking_id || "-"}</strong></div>
                </div>
                <div className="payment-card-footer">
                  <span className="payment-label">Status</span>
                  <span className={`payment-status payment-status-${st}`}>{st}</span>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;