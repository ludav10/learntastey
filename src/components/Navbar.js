import { NavLink } from 'react-router-dom';
import { useWine } from '../context/WineContext';

const BASE_ITEMS = [
  { to: '/',        end: true, icon: '🏠', label: 'Home'    },
  { to: '/journal',            icon: '📓', label: 'Journal' },
  { to: '/learn',              icon: '🎓', label: 'Learn'   },
  { to: '/party',              icon: '🎉', label: 'Games'   },
];

export default function Navbar() {
  const { getLevel } = useWine();
  const { level } = getLevel();

  const items = [...BASE_ITEMS, { to: '/level', icon: level.emoji, label: 'Level' }];

  return (
    <>
      {/* ── Top bar (visible on all sizes, links hidden on mobile) ── */}
      <nav className="navbar">
        <div className="navbar-logo">
          <span className="logo-learn">Learn</span>
          <span className="logo-tasty">Tasty</span>
        </div>
        <div className="navbar-links">
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end || false}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {item.icon} {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Bottom tab bar (mobile only) ── */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {items.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end || false}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
