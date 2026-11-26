const mongoose = require('mongoose');
const { Book, CATEGORIES, ISBN_REGEX } = require('../models/Book');
const Loan = require('../models/Loan');
const { generateBookCode } = require('../utils/bookCodeGenerator');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseTotalCopies = (value) => {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'boolean' ||
    String(value).trim() === ''
  ) {
    return NaN;
  }
  return Number(value);
};

const createBook = async (req, res) => {
  try {
    const { title, author, isbn, category, totalCopies } = req.body;

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedAuthor = typeof author === 'string' ? author.trim() : '';
    const trimmedIsbn = typeof isbn === 'string' ? isbn.trim() : '';
    const parsedCopies = parseTotalCopies(totalCopies);

    if (!trimmedTitle) {
      return sendError(res, 400, 'Title is required');
    }
    if (!trimmedAuthor) {
      return sendError(res, 400, 'Author is required');
    }
    if (!ISBN_REGEX.test(trimmedIsbn)) {
      return sendError(res, 400, 'ISBN must contain exactly 10 or 13 digits');
    }
    if (!CATEGORIES.includes(category)) {
      return sendError(
        res,
        400,
        `Category must be one of: ${CATEGORIES.join(', ')}`
      );
    }
    if (!Number.isInteger(parsedCopies) || parsedCopies < 1 || parsedCopies > 20) {
      return sendError(res, 400, 'Total Copies must be an integer between 1 and 20');
    }

    const existingBook = await Book.findOne({ isbn: trimmedIsbn });
    if (existingBook) {
      return sendError(res, 409, 'A book with this ISBN already exists');
    }

    const bookCode = await generateBookCode(category);

    const book = await Book.create({
      bookCode,
      title: trimmedTitle,
      author: trimmedAuthor,
      isbn: trimmedIsbn,
      category,
      totalCopies: parsedCopies,
      availableCopies: parsedCopies,
    });

    return sendSuccess(res, 201, 'Book added successfully', book);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.isbn) {
      return sendError(res, 409, 'A book with this ISBN already exists');
    }
    if (err.name === 'ValidationError') {
      const firstMsg = Object.values(err.errors)[0]?.message || 'Validation failed';
      return sendError(res, 400, firstMsg);
    }
    return sendError(res, 500, 'Failed to add book');
  }
};

const getBooks = async (req, res) => {
  try {
    const { category, availableOnly, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 5));

    const filter = {};

    if (category && category !== 'All') {
      if (!CATEGORIES.includes(category)) {
        return sendError(res, 400, 'Invalid category filter');
      }
      filter.category = category;
    }

    if (availableOnly === 'true') {
      filter.availableCopies = { $gt: 0 };
    }

    if (typeof search === 'string' && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: regex }, { author: regex }];
    }

    const totalBooks = await Book.countDocuments(filter);
    const totalPages = Math.ceil(totalBooks / limit);
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;

    const books = await Book.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit);

    return sendSuccess(res, 200, 'Books fetched successfully', {
      books,
      currentPage: safePage,
      totalPages,
      totalBooks,
      limit,
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch books');
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid book ID');
    }

    const book = await Book.findById(id);
    if (!book) {
      return sendError(res, 404, 'Book not found');
    }

    return sendSuccess(res, 200, 'Book fetched successfully', book);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch book');
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid book ID');
    }

    const book = await Book.findById(id);
    if (!book) {
      return sendError(res, 404, 'Book not found');
    }

    const { title, author, totalCopies } = req.body;
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedAuthor = typeof author === 'string' ? author.trim() : '';
    const parsedCopies = parseTotalCopies(totalCopies);

    if (!trimmedTitle) {
      return sendError(res, 400, 'Title is required');
    }
    if (!trimmedAuthor) {
      return sendError(res, 400, 'Author is required');
    }
    if (!Number.isInteger(parsedCopies) || parsedCopies < 1 || parsedCopies > 20) {
      return sendError(res, 400, 'Total Copies must be an integer between 1 and 20');
    }

    const issuedCopies = await Loan.countDocuments({
      book: book._id,
      status: 'Issued',
    });

    if (parsedCopies < issuedCopies) {
      return sendError(
        res,
        400,
        `Total Copies cannot be reduced below currently issued copies (${issuedCopies})`
      );
    }

    book.title = trimmedTitle;
    book.author = trimmedAuthor;
    book.totalCopies = parsedCopies;
    book.availableCopies = parsedCopies - issuedCopies;

    await book.save();

    return sendSuccess(res, 200, 'Book updated successfully', book);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const firstMsg = Object.values(err.errors)[0]?.message || 'Validation failed';
      return sendError(res, 400, firstMsg);
    }
    return sendError(res, 500, 'Failed to update book');
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid book ID');
    }

    const book = await Book.findById(id);
    if (!book) {
      return sendError(res, 404, 'Book not found');
    }

    const activeLoansCount = await Loan.countDocuments({
      book: book._id,
      status: 'Issued',
    });

    if (activeLoansCount > 0 || book.availableCopies < book.totalCopies) {
      return sendError(
        res,
        400,
        'Cannot delete book while one or more copies are currently issued'
      );
    }

    await Loan.deleteMany({ book: book._id });
    await Book.findByIdAndDelete(book._id);

    return sendSuccess(res, 200, 'Book deleted successfully', null);
  } catch (err) {
    return sendError(res, 500, 'Failed to delete book');
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
};
