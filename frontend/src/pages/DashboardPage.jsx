import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookPlus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import {
  createBook,
  deleteBook,
  fetchBooks,
  getErrorMessage,
  issueBook,
  updateBook,
} from '../api/libraryApi';
import { BOOK_CATEGORIES } from '../utils/formatters';
import StatsCards from '../components/StatsCards';
import BookFormModal from '../components/BookFormModal';
import IssueBookModal from '../components/IssueBookModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function DashboardPage({ stats, statsLoading, refreshStats, notify }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Query filters & pagination
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalBooks: 0,
    limit: 5,
  });

  // Modals
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [issuingBook, setIssuingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBooks({
        category,
        availableOnly,
        search: debouncedSearch,
        page,
        limit: 5,
      });
      setBooks(data.books || []);
      setPagination({
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 0,
        totalBooks: data.totalBooks || 0,
        limit: data.limit || 5,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load books'));
    } finally {
      setLoading(false);
    }
  }, [category, availableOnly, debouncedSearch, page]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const refreshAll = async () => {
    await Promise.all([loadBooks(), refreshStats()]);
  };

  const openAddModal = () => {
    setEditingBook(null);
    setModalError('');
    setBookModalOpen(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setModalError('');
    setBookModalOpen(true);
  };

  const handleBookSubmit = async (payload) => {
    setSubmitting(true);
    setModalError('');
    try {
      if (editingBook) {
        const res = await updateBook(editingBook._id, payload);
        notify('success', res.message || 'Book updated successfully');
      } else {
        const res = await createBook(payload);
        notify(
          'success',
          `${res.message || 'Book added'} (${res.data?.bookCode || ''})`
        );
        setPage(1);
      }
      setBookModalOpen(false);
      await refreshAll();
    } catch (err) {
      setModalError(getErrorMessage(err, 'Failed to save book'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueSubmit = async (payload) => {
    if (!issuingBook) return;
    setSubmitting(true);
    setModalError('');
    try {
      const res = await issueBook(issuingBook._id, payload);
      notify('success', res.message || 'Book issued successfully');
      setIssuingBook(null);
      await refreshAll();
    } catch (err) {
      setModalError(getErrorMessage(err, 'Failed to issue book'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBook) return;
    setSubmitting(true);
    setModalError('');
    try {
      const res = await deleteBook(deletingBook._id);
      notify('success', res.message || 'Book deleted successfully');
      setDeletingBook(null);
      await refreshAll();
    } catch (err) {
      setModalError(getErrorMessage(err, 'Failed to delete book'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
  };

  const handleAvailableToggle = (checked) => {
    setAvailableOnly(checked);
    setPage(1);
  };

  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, idx) => idx + 1
  );

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>Catalog & Circulation</h1>
          <p className="page-subtitle">
            Manage library inventory, issue books to members, and track overdue returns.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAddModal}>
          <BookPlus size={18} />
          Add Book
        </button>
      </div>

      <StatsCards stats={stats} loading={statsLoading} />

      <section className="panel" aria-label="Book collection">
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="search"
              placeholder="Search by title or author..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search by title or author"
            />
          </div>

          <div className="filter-controls">
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              aria-label="Filter by category"
              className="filter-select"
            >
              <option value="All">All Categories</option>
              {BOOK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label className="checkbox-pill">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => handleAvailableToggle(e.target.checked)}
              />
              <span>Available only</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="empty-state">Loading books...</div>
        ) : books.length === 0 ? (
          <div className="empty-state">
            <p>No books match your current filters.</p>
            {(searchInput || category !== 'All' || availableOnly) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedSearch('');
                  setCategory('All');
                  setAvailableOnly(false);
                  setPage(1);
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="table-wrap desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book Code</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Available / Total</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => {
                    const outOfStock = book.availableCopies === 0;
                    const hasIssuedCopies = book.availableCopies < book.totalCopies;
                    return (
                      <tr key={book._id}>
                        <td>
                          <span className="code-badge">{book.bookCode}</span>
                        </td>
                        <td>
                          <Link to={`/books/${book._id}`} className="book-title-link">
                            {book.title}
                          </Link>
                          <div className="sub-meta mono">ISBN: {book.isbn}</div>
                        </td>
                        <td>{book.author}</td>
                        <td>
                          <span className="category-pill">{book.category}</span>
                        </td>
                        <td>
                          <span className={`copies-badge ${outOfStock ? 'copies-zero' : ''}`}>
                            {book.availableCopies} / {book.totalCopies}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              disabled={outOfStock}
                              onClick={() => {
                                setModalError('');
                                setIssuingBook(book);
                              }}
                              title={outOfStock ? 'No copies available' : 'Issue a copy'}
                            >
                              <Send size={13} />
                              Issue
                            </button>
                            <Link
                              to={`/books/${book._id}`}
                              className="btn btn-secondary btn-xs"
                              title="View details & loan history"
                            >
                              <Eye size={13} />
                              Loans
                            </Link>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              onClick={() => openEditModal(book)}
                              title="Edit book"
                            >
                              <Pencil size={13} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-outline btn-xs"
                              disabled={hasIssuedCopies}
                              onClick={() => {
                                setModalError('');
                                setDeletingBook(book);
                              }}
                              title={
                                hasIssuedCopies
                                  ? 'Cannot delete while copies are issued'
                                  : 'Delete book'
                              }
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards mobile-only">
              {books.map((book) => {
                const outOfStock = book.availableCopies === 0;
                const hasIssuedCopies = book.availableCopies < book.totalCopies;
                return (
                  <article key={book._id} className="book-mobile-card">
                    <div className="book-mobile-top">
                      <span className="code-badge">{book.bookCode}</span>
                      <span className="category-pill">{book.category}</span>
                    </div>
                    <Link to={`/books/${book._id}`} className="book-mobile-title">
                      {book.title}
                    </Link>
                    <p className="book-mobile-author">by {book.author}</p>
                    <div className="book-mobile-meta">
                      <span className="mono">ISBN: {book.isbn}</span>
                      <span className={`copies-badge ${outOfStock ? 'copies-zero' : ''}`}>
                        Available: {book.availableCopies} / {book.totalCopies}
                      </span>
                    </div>
                    <div className="book-mobile-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        disabled={outOfStock}
                        onClick={() => {
                          setModalError('');
                          setIssuingBook(book);
                        }}
                      >
                        <Send size={13} />
                        Issue
                      </button>
                      <Link to={`/books/${book._id}`} className="btn btn-secondary btn-xs">
                        <Eye size={13} />
                        Loans
                      </Link>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => openEditModal(book)}
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-outline btn-xs"
                        disabled={hasIssuedCopies}
                        onClick={() => {
                          setModalError('');
                          setDeletingBook(book);
                        }}
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="pagination-bar">
              <span className="pagination-info">
                Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)} ·{' '}
                {pagination.totalBooks} {pagination.totalBooks === 1 ? 'book' : 'books'}
              </span>

              {pagination.totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    disabled={pagination.currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </button>
                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`btn btn-xs ${
                        num === pagination.currentPage ? 'btn-primary' : 'btn-secondary'
                      }`}
                      onClick={() => setPage(num)}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    disabled={pagination.currentPage >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <BookFormModal
        isOpen={bookModalOpen}
        book={editingBook}
        onClose={() => setBookModalOpen(false)}
        onSubmit={handleBookSubmit}
        submitting={submitting}
        serverError={modalError}
      />

      <IssueBookModal
        isOpen={Boolean(issuingBook)}
        book={issuingBook}
        onClose={() => setIssuingBook(null)}
        onSubmit={handleIssueSubmit}
        submitting={submitting}
        serverError={modalError}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingBook)}
        book={deletingBook}
        onClose={() => setDeletingBook(null)}
        onConfirm={handleDeleteConfirm}
        submitting={submitting}
        serverError={modalError}
      />
    </div>
  );
}
