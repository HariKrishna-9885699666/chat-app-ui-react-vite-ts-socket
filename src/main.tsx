import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavTab from './NavTab';
import App from './App';
import FloatingIcon from './FloatingIcon';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (roomId.trim() !== "") {
      navigate(`/${roomId}`);
    }
  };

  return (
    <div className="container">
      <NavTab />
      <div className="row justify-content-center">
        <div className="col-md-6">
          <form onSubmit={handleSubmit}>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">
                Join Room
              </button>
            </div>
          </form>
        </div>
      </div>
      <FloatingIcon />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Router>
    <Routes>
      <Route path="/:roomId" element={<App />} />
      <Route path="/" element={<Home />} />
    </Routes>
  </Router>
);
