import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import {
  deleteBook,
  fetchBookLoans,
  getErrorMessage,
  issueBook,
  returnLoan,
  updateBook,
} from '../api/libraryApi';
import { formatCurrencyINR, formatDisplayDate } from '../utils/formatters';
import BookFormModal from '../components/BookFormModal';
import IssueBookModal from '../components/IssueBookModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function BookDetailsPage({ refreshStats, notify }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [returningId, setReturningId] = useState(null);
  const [modalError, setModalError] = useState('');

  const loadBookDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBookLoans(id);
      setBook(data.book);
      setLoans(data.loans || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load book details'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBookDetails();
  }, [loadBookDetails]);

  const handleReturn = async (loan) => {
    setReturningId(loan._id);
    try {
      const res = await returnLoan(loan._id);
      const fine = res.data?.loan?.fine ?? 0;
      notify(
        'success',
        fine > 0
          ? `Book returned. Late fine collected: ${formatCurrencyINR(fine)}`
          : 'Book returned on time. Fine: ₹0'
      );
      await Promise.all([loadBookDetails(), refreshStats()]);
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to return book'));
    } finally {
      setReturningId(null);
    }
  };

  const handleEditSubmit = async (payload) => {
    if (!book) return;
    setSubmitting(true);
    setModalError('');
    try {
      const res = await updateBook(book._id, payload);
      notify('success', res.message || 'Book updated successfully');
      setEditOpen(false);
      await Promise.all([loadBookDetails(), refreshStats()]);
    } catch (err) {
      setModalError(getErrorMessage(err, 'Failed to update book'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueSubmit = async (payload) => {
    if (!book) return;
    setSubmitting(true);
    setModalError('');
    try {
      const res = await issueBook(book._id, payload);
      notify('success', res.message || 'Book issued successfully');
      setIssueOpen(false);
      await Promise.all([loadBookDetails(), refreshStats()]);
    } catch (err) {
      setModalError(getErrorMessage(err, 'Failed to issue book'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!book) return;
    setSubmitting(true);
    setModalError('');
    try {
      const res = await deleteBook(book._id);
      notify('success', res.message || 'Book deleted successfully');
      setDeleteOpen(false);
      await refreshStats();
      navigate('/');
    } catch (err) {
      setModalError(getErrorMessage(err, 'Failed to delete book'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-stack">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
        <div className="panel empty-state">Loading book details...</div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="page-stack">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
        <div className="alert alert-error">{error || 'Book not found'}</div>
      </div>
    );
  }

  const outOfStock = book.availableCopies === 0;
  const hasIssuedCopies = book.availableCopies < book.totalCopies;

  return (
    <div className="page-stack">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <section className="panel details-card">
        <div className="details-header">
          <div>
            <div className="details-badges">
              <span className="code-badge">{book.bookCode}</span>
              <span className="category-pill">{book.category}</span>
            </div>
            <h1 className="details-title">{book.title}</h1>
            <p className="details-author">by {book.author}</p>
          </div>

          <div className="details-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={outOfStock}
              onClick={() => {
                setModalError('');
                setIssueOpen(true);
              }}
            >
              <Send size={16} />
              Issue Book
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setModalError('');
                setEditOpen(true);
              }}
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger-outline"
              disabled={hasIssuedCopies}
              onClick={() => {
                setModalError('');
                setDeleteOpen(true);
              }}
              title={
                hasIssuedCopies
                  ? 'Cannot delete while copies are issued'
                  : 'Delete book'
              }
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        <div className="details-meta-grid">
          <div className="meta-item">
            <span className="meta-label">ISBN</span>
            <span className="meta-value mono">{book.isbn}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Available / Total Copies</span>
            <span className={`meta-value copies-badge ${outOfStock ? 'copies-zero' : ''}`}>
              {book.availableCopies} / {book.totalCopies}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Currently Issued</span>
            <span className="meta-value">{book.totalCopies - book.availableCopies}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Total Recorded Loans</span>
            <span className="meta-value">{loans.length}</span>
          </div>
        </div>
      </section>

      <section className="panel" aria-label="Loan history">
        <div className="section-header">
          <h2>Loan History</h2>
          <p className="section-subtitle">
            All active and past loans for this title. Overdue loans accrue ₹5/day after the due date.
          </p>
        </div>

        {loans.length === 0 ? (
          <div className="empty-state">No loan records for this book yet.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="table-wrap desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Member ID</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Fine</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan._id}>
                      <td><strong>{loan.memberName}</strong></td>
                      <td className="mono">{loan.memberId}</td>
                      <td>{formatDisplayDate(loan.issueDate)}</td>
                      <td>{formatDisplayDate(loan.dueDate)}</td>
                      <td>{formatDisplayDate(loan.returnDate)}</td>
                      <td>{formatCurrencyINR(loan.fine)}</td>
                      <td>
                        <div className="status-group">
                          <span
                            className={`status-badge ${
                              loan.status === 'Returned' ? 'status-returned' : 'status-issued'
                            }`}
                          >
                            {loan.status}
                          </span>
                          {loan.isOverdue && (
                            <span className="status-badge status-overdue">Overdue</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        {loan.status === 'Issued' ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            disabled={returningId === loan._id}
                            onClick={() => handleReturn(loan)}
                          >
                            <RotateCcw size={13} />
                            {returningId === loan._id ? 'Returning...' : 'Return'}
                          </button>
                        ) : (
                          <span className="muted-dash">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards mobile-only">
              {loans.map((loan) => (
                <article key={loan._id} className="book-mobile-card">
                  <div className="book-mobile-top">
                    <strong>{loan.memberName}</strong>
                    <div className="status-group">
                      <span
                        className={`status-badge ${
                          loan.status === 'Returned' ? 'status-returned' : 'status-issued'
                        }`}
                      >
                        {loan.status}
                      </span>
                      {loan.isOverdue && (
                        <span className="status-badge status-overdue">Overdue</span>
                      )}
                    </div>
                  </div>
                  <div className="loan-mobile-grid">
                    <span>Member ID: <strong className="mono">{loan.memberId}</strong></span>
                    <span>Fine: <strong>{formatCurrencyINR(loan.fine)}</strong></span>
                    <span>Issued: {formatDisplayDate(loan.issueDate)}</span>
                    <span>Due: {formatDisplayDate(loan.dueDate)}</span>
                    <span>Returned: {formatDisplayDate(loan.returnDate)}</span>
                  </div>
                  {loan.status === 'Issued' && (
                    <div className="book-mobile-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        disabled={returningId === loan._id}
                        onClick={() => handleReturn(loan)}
                      >
                        <RotateCcw size={13} />
                        {returningId === loan._id ? 'Returning...' : 'Return Book'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <BookFormModal
        isOpen={editOpen}
        book={book}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        submitting={submitting}
        serverError={modalError}
      />

      <IssueBookModal
        isOpen={issueOpen}
        book={book}
        onClose={() => setIssueOpen(false)}
        onSubmit={handleIssueSubmit}
        submitting={submitting}
        serverError={modalError}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        book={book}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        submitting={submitting}
        serverError={modalError}
      />
    </div>
  );
}
