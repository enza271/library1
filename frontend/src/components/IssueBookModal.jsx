import { useEffect, useState } from 'react';
import { Calendar, X } from 'lucide-react';
import {
  calculateDueDateString,
  formatDisplayDate,
  getTodayDateString,
} from '../utils/formatters';

export default function IssueBookModal({
  isOpen,
  book,
  onClose,
  onSubmit,
  submitting,
  serverError,
}) {
  const today = getTodayDateString();
  const [memberName, setMemberName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [issueDate, setIssueDate] = useState(today);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setMemberName('');
    setMemberId('');
    setIssueDate(getTodayDateString());
    setErrors({});
  }, [isOpen, book]);

  if (!isOpen || !book) return null;

  const dueDatePreview = calculateDueDateString(issueDate, 14);

  const validate = () => {
    const nextErrors = {};
    if (!memberName.trim()) {
      nextErrors.memberName = 'Member Name is required.';
    }
    if (!memberId.trim()) {
      nextErrors.memberId = 'Member ID is required.';
    }
    if (!issueDate) {
      nextErrors.issueDate = 'Issue Date is required.';
    } else if (issueDate > getTodayDateString()) {
      nextErrors.issueDate = 'Issue Date cannot be a future date.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      memberName: memberName.trim(),
      memberId: memberId.trim(),
      issueDate,
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="issue-modal-title">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2 id="issue-modal-title">Issue Book</h2>
            <p className="modal-subtitle">
              <span className="mono">{book.bookCode}</span> · {book.title}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {serverError && (
              <div className="alert alert-error" role="alert">
                {serverError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="issue-member-name">Member Name *</label>
              <input
                id="issue-member-name"
                type="text"
                placeholder="e.g., Aarav Nair"
                value={memberName}
                onChange={(e) => {
                  setMemberName(e.target.value);
                  if (errors.memberName) setErrors((p) => ({ ...p, memberName: undefined }));
                }}
                className={errors.memberName ? 'input-error' : ''}
              />
              {errors.memberName && <span className="field-error">{errors.memberName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="issue-member-id">Member ID *</label>
              <input
                id="issue-member-id"
                type="text"
                placeholder="e.g., MEM-204"
                value={memberId}
                onChange={(e) => {
                  setMemberId(e.target.value);
                  if (errors.memberId) setErrors((p) => ({ ...p, memberId: undefined }));
                }}
                className={errors.memberId ? 'input-error' : ''}
              />
              {errors.memberId && <span className="field-error">{errors.memberId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="issue-date">Issue Date *</label>
              <input
                id="issue-date"
                type="date"
                max={today}
                value={issueDate}
                onChange={(e) => {
                  setIssueDate(e.target.value);
                  if (errors.issueDate) setErrors((p) => ({ ...p, issueDate: undefined }));
                }}
                className={errors.issueDate ? 'input-error' : ''}
              />
              {errors.issueDate && <span className="field-error">{errors.issueDate}</span>}
            </div>

            {dueDatePreview && (
              <div className="info-banner">
                <Calendar size={16} />
                <span>
                  Automatic Due Date (14 days): <strong>{formatDisplayDate(dueDatePreview)}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Issuing...' : 'Confirm Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
