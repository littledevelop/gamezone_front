import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Login from './pages/Login.jsx';
import "./styles/App.css";
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const handleLogin=()=>{
    setIsLoggedIn(true);
  }

  const handleLogout=()=>{
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
  }
 return (
    <div>
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout}/>
      ):(
        <Login onLogin={handleLogin}/>
      )}
    </div>
  );
}

export default App;
