import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  book,
  onClose,
  onConfirm,
  submitting,
  serverError,
}) {
  if (!isOpen || !book) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <div className="modal-card modal-card--sm">
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <span className="danger-circle">
              <AlertTriangle size={18} />
            </span>
            <h2 id="delete-modal-title">Delete Book</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {serverError && (
            <div className="alert alert-error" role="alert">
              {serverError}
            </div>
          )}
          <p className="confirm-text">
            Are you sure you want to delete <strong>{book.title}</strong> (
            <span className="mono">{book.bookCode}</span>)? This will permanently remove the book
            and its past returned loan records.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete Book'}
          </button>
        </div>
      </div>
    </div>
  );
}
