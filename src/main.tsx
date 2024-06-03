import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <Router>
    <Routes>
      <Route path="/:roomId" element={<App />} />
      <Route
        path="/"
        element={
          <div>Welcome to Chat App! Please enter a room ID in the URL.</div>
        }
      />
    </Routes>
  </Router>
);

