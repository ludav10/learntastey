import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span className="logo-learn">Learn</span>
        <span className="logo-tasty">Tasty</span>
      </div>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
        <NavLink to="/journal" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Journal</NavLink>
        <NavLink to="/explore" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Explore</NavLink>
        <NavLink to="/globe" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🌍</NavLink>
        <NavLink to="/learn" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Learn</NavLink>
      </div>
    </nav>
  );
}
