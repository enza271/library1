import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <BookOpen size={20} />
          </span>
          <div>
            <span className="brand-title">LibrisDesk</span>
            <span className="brand-subtitle">Library Book Lending Manager</span>
          </div>
        </Link>

        <div className="navbar-meta">
          <span className="pill-info">Loan Term: 14 Days</span>
          <span className="pill-info">Late Fine: ₹5 / day</span>
        </div>
      </div>
    </header>
  );
}
