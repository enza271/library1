const express = require('express');
const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');
const { issueBook, getBookLoans } = require('../controllers/loanController');

const router = express.Router();

router.get('/', getBooks);
router.post('/', createBook);
router.get('/:id', getBookById);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

router.post('/:id/issue', issueBook);
router.get('/:id/loans', getBookLoans);

module.exports = router;
