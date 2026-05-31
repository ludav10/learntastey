import { NavLink } from 'react-router-dom';
import { useWine } from '../context/WineContext';

export default function Navbar() {
  const { getLevel } = useWine();
  const { level } = getLevel();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span className="logo-learn">Learn</span>
        <span className="logo-tasty">Tasty</span>
      </div>
      <div className="navbar-links">
        <NavLink to="/"       end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
        <NavLink to="/journal"    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Journal</NavLink>
        <NavLink to="/learn"      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Learn</NavLink>
        <NavLink to="/party"      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Party 🎉</NavLink>
        <NavLink to="/level"      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{level.emoji} Level</NavLink>
      </div>
    </nav>
  );
}
