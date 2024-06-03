import { useNavigate } from 'react-router-dom';

function NavTab(): JSX.Element {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/');
  };

  return (
    <>
      <nav className="navbar navbar-light bg-light mb-5">
        <div className="container-fluid d-flex justify-content-center">
          <span
            className="navbar-brand mb-0 h1 text-center"
            onClick={handleRedirect}
            style={{ cursor: 'pointer' }}
          >
            Chat App - React + Vite + TS + Socket.io + Bootstrap CSS
          </span>
        </div>
      </nav>
    </>
  );
}

export default NavTab;
