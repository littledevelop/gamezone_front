import { useEffect, useState } from "react";
import { Crown, Search, CalendarDays, User } from "lucide-react";
import api from "../api/axios";
import "../styles/Memberships.css";

function Memberships() {
  const [memberships, setMemberships] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get("/memberships");
        if (!mounted) return;
        if (res.data.success) setMemberships(res.data.memberships || []);
        else if (Array.isArray(res.data)) setMemberships(res.data);
      } catch (e) {
        if (mounted) setMessage(e.response?.data?.message || "Unable to connect");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleManage = (m) => {
    console.log("Manage:", m.id);
  };

  const filtered = memberships.filter(
    (m) =>
      (m.membership_type_name || "").toLowerCase().includes(filter.toLowerCase()) ||
      (m.user_name || m.full_name || "").toLowerCase().includes(filter.toLowerCase())
  );
  const activeCount = memberships.filter((m) => m.status === "active" || !m.status).length;

  if (loading) return <div className="memberships-loading"><div className="loading-spinner"/><p>Loading memberships...</p></div>;

  return (
    <div className="memberships-page">
      <div className="memberships-header">
        <div>
          <h1>Memberships</h1>
          <p>{memberships.length} total • {activeCount} active • Manage subscriptions</p>
        </div>
        <div className="memberships-count"><Crown size={14}/> <strong>{activeCount}</strong> Active</div>
      </div>

      <div className="memberships-toolbar">
        <div className="memberships-search">
          <Search size={16} style={{color:'#94A3B8'}}/>
          <input placeholder="Search plan, user..." value={filter} onChange={(e)=>setFilter(e.target.value)} />
        </div>
        <span style={{fontSize:'12.5px',color:'#64748B'}}>{filtered.length} results</span>
      </div>

      {message && <div className="memberships-message">{message}</div>}

      {filtered.length===0 ? (
        <div className="memberships-empty"><Crown size={28}/><h3>No Memberships Found</h3><p>No records match your search.</p></div>
      ) : (
        <div className="memberships-grid">
          {filtered.map((m)=>(
            <div className="membership-card" key={m.id}>
              <div className="membership-card-top">
                <div className="membership-icon"><Crown size={18}/></div>
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  <span className="membership-id">#{m.id}</span>
                  <span className="membership-status active">Active</span>
                </div>
              </div>
              <h3>{m.membership_type_name || "Premium Plan"}</h3>
              <div className="membership-price">₹{m.price || "0.00"}<span>/month</span></div>
              <div className="membership-user"><User size={14}/><span>{m.user_name || m.full_name || "N/A"}</span></div>
              <div className="membership-details">
                <div className="membership-detail-row"><span><CalendarDays size={12}/>Start Date</span><strong>{m.start_date ? new Date(m.start_date).toLocaleDateString('en-IN') : "N/A"}</strong></div>
                <div className="membership-detail-row"><span><CalendarDays size={12}/>End Date</span><strong>{m.end_date ? new Date(m.end_date).toLocaleDateString('en-IN') : "N/A"}</strong></div>
                <div className="membership-detail-row"><span>Auto Renew</span><strong className={m.auto_renew ? 'yes' : 'no'}>{m.auto_renew ? 'Enabled' : 'Disabled'}</strong></div>
              </div>
              <div className="membership-card-footer">
                <span>✓ Premium Access</span>
                <button className="membership-manage-btn" onClick={()=>handleManage(m)}>Manage</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Memberships;