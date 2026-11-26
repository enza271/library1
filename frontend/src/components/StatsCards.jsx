import {
  AlertTriangle,
  BookCopy,
  BookMarked,
  IndianRupee,
  Library,
} from 'lucide-react';
import { formatCurrencyINR } from '../utils/formatters';

export default function StatsCards({ stats, loading }) {
  const cards = [
    {
      label: 'Total Titles',
      value: loading ? '—' : stats.totalTitles ?? 0,
      subtext: 'Unique catalog entries',
      icon: Library,
      tone: 'primary',
    },
    {
      label: 'Total Copies',
      value: loading ? '—' : stats.totalCopies ?? 0,
      subtext: 'Physical inventory',
      icon: BookCopy,
      tone: 'slate',
    },
    {
      label: 'Currently Issued',
      value: loading ? '—' : stats.issuedCopies ?? 0,
      subtext: 'Active member loans',
      icon: BookMarked,
      tone: 'amber',
    },
    {
      label: 'Overdue Loans',
      value: loading ? '—' : stats.overdueLoans ?? 0,
      subtext: 'Past 14-day due date',
      icon: AlertTriangle,
      tone: (stats.overdueLoans ?? 0) > 0 ? 'danger' : 'slate',
    },
    {
      label: 'Total Fine Collected',
      value: loading ? '—' : formatCurrencyINR(stats.totalFineCollected ?? 0),
      subtext: 'From returned loans',
      icon: IndianRupee,
      tone: 'success',
    },
  ];

  return (
    <section className="stats-grid" aria-label="Library statistics">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className={`stat-card stat-card--${card.tone}`}>
            <div className="stat-card-header">
              <span className="stat-label">{card.label}</span>
              <span className="stat-icon">
                <Icon size={18} />
              </span>
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-subtext">{card.subtext}</div>
          </article>
        );
      })}
    </section>
  );
}
