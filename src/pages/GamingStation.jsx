import { useEffect, useState } from "react";
import { Gamepad2, Search, Zap, Monitor } from "lucide-react";
import api from "../api/axios";
import "../styles/GamingStation.css";

function GamingStation() {
  const [stations, setStations] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get("/gaming-stations");
        if (!mounted) return;
        if (res.data.success) setStations(res.data.data || []);
        else if (Array.isArray(res.data)) setStations(res.data);
      } catch (e) {
        if (mounted) setMessage(e.response?.data?.message || "Unable to connect");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleManage = (station) => {
    // TODO: open manage modal / navigate
    console.log("Manage station:", station.id);
    // Example: navigate(`/stations/${station.id}`)
    // or setSelectedStation(station)
  };

  const filtered = stations.filter(s => 
    s.station_name?.toLowerCase().includes(filter.toLowerCase()) ||
    s.status?.toLowerCase().includes(filter.toLowerCase())
  );
  const active = stations.filter(s => ["active","available","online"].includes(s.status)).length;

  if (loading) return <div className="gaming-station-loading"><div className="loading-spinner"/><p>Loading stations...</p></div>;

  return (
    <div className="gaming-station-page">
      <div className="gaming-station-header">
        <div>
          <h1>Gaming Stations</h1>
          <p>{stations.length} stations • {active} available • Monitor performance</p>
        </div>
        <div className="station-count"><Zap size={14} /> <strong>{active}</strong> Online</div>
      </div>

      <div className="gaming-toolbar">
        <div className="gaming-search">
          <Search size={16} style={{color:'#94A3B8'}}/>
          <input placeholder="Search stations, status..." value={filter} onChange={e=>setFilter(e.target.value)} />
        </div>
        <span style={{fontSize:'12.5px',color:'#64748B'}}>{filtered.length} results</span>
      </div>

      {message && <div className="gaming-station-message">{message}</div>}

      {filtered.length===0 ? (
        <div className="gaming-station-empty"><Monitor size={28}/><h3>No Stations Found</h3><p>No stations match your search.</p></div>
      ) : (
        <div className="gaming-station-grid">
          {filtered.map(st => (
            <div className="gaming-station-card" key={st.id}>
              <div className="station-card-top">
                <div className="station-icon"><Gamepad2 size={20}/></div>
                <span className={`station-status ${st.status}`}>{st.status}</span>
              </div>
              <h3>{st.station_name}</h3>
              <div className="station-details">
                <div className="station-detail-row"><span>ID</span><strong>#{st.id}</strong></div>
                <div className="station-detail-row"><span>Platform</span><strong>{st.platform_name || 'PC'}</strong></div>
                <div className="station-detail-row"><span>Spec</span><strong>{st.specs || 'High-End'}</strong></div>
              </div>
              <div className="station-card-footer">
                <span>● Operational</span>
                <button 
                  className="station-manage-btn"
                  onClick={() => handleManage(st)}
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default GamingStation;