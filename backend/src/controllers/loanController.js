const mongoose = require('mongoose');
const { Book } = require('../models/Book');
const Loan = require('../models/Loan');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const {
  getTodayDateString,
  getTodayUTC,
  parseDateOnlyToUTC,
  addDaysUTC,
  diffDaysUTC,
} = require('../utils/dateUtils');

const DUE_DAYS = 14;
const FINE_PER_DAY = 5;

const formatLoanWithOverdue = (loanDoc, todayUTC) => {
  const loan = typeof loanDoc.toObject === 'function' ? loanDoc.toObject() : { ...loanDoc };
  const isOverdue =
    loan.status === 'Issued' &&
    todayUTC.getTime() > new Date(loan.dueDate).getTime();

  return {
    ...loan,
    isOverdue,
  };
};

const issueBook = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid book ID');
    }

    const { memberName, memberId, issueDate } = req.body;
    const trimmedMemberName = typeof memberName === 'string' ? memberName.trim() : '';
    const trimmedMemberId = typeof memberId === 'string' ? memberId.trim() : '';

    if (!trimmedMemberName) {
      return sendError(res, 400, 'Member Name is required');
    }
    if (!trimmedMemberId) {
      return sendError(res, 400, 'Member ID is required');
    }

    const dateInput = issueDate ? issueDate : getTodayDateString();
    const issueDateUTC = parseDateOnlyToUTC(dateInput);
    if (!issueDateUTC) {
      return sendError(res, 400, 'Invalid Issue Date format. Use YYYY-MM-DD');
    }

    const todayUTC = getTodayUTC();
    if (issueDateUTC.getTime() > todayUTC.getTime()) {
      return sendError(res, 400, 'Issue Date cannot be a future date');
    }

    const book = await Book.findById(id);
    if (!book) {
      return sendError(res, 404, 'Book not found');
    }

    if (book.availableCopies <= 0) {
      return sendError(res, 400, 'No copies available to issue');
    }

    const existingActiveLoan = await Loan.findOne({
      book: book._id,
      memberId: trimmedMemberId,
      status: 'Issued',
    });

    if (existingActiveLoan) {
      return sendError(
        res,
        409,
        `Member ${trimmedMemberId} already holds an unreturned copy of this book`
      );
    }

    const updatedBook = await Book.findOneAndUpdate(
      { _id: book._id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      return sendError(res, 400, 'No copies available to issue');
    }

    const dueDateUTC = addDaysUTC(issueDateUTC, DUE_DAYS);

    let loan;
    try {
      loan = await Loan.create({
        book: book._id,
        memberName: trimmedMemberName,
        memberId: trimmedMemberId,
        issueDate: issueDateUTC,
        dueDate: dueDateUTC,
        returnDate: null,
        fine: 0,
        status: 'Issued',
      });
    } catch (createErr) {
      await Book.findByIdAndUpdate(book._id, { $inc: { availableCopies: 1 } });
      throw createErr;
    }

    return sendSuccess(res, 201, 'Book issued successfully', {
      loan: formatLoanWithOverdue(loan, todayUTC),
      book: updatedBook,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const firstMsg = Object.values(err.errors)[0]?.message || 'Validation failed';
      return sendError(res, 400, firstMsg);
    }
    return sendError(res, 500, 'Failed to issue book');
  }
};

const returnBook = async (req, res) => {
  try {
    const { loanId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return sendError(res, 400, 'Invalid loan ID');
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return sendError(res, 404, 'Loan record not found');
    }

    if (loan.status === 'Returned') {
      return sendError(res, 400, 'This loan has already been returned');
    }

    const todayUTC = getTodayUTC();
    const overdueDays = diffDaysUTC(todayUTC, new Date(loan.dueDate));
    const fine = overdueDays > 0 ? overdueDays * FINE_PER_DAY : 0;

    const updatedLoan = await Loan.findOneAndUpdate(
      { _id: loanId, status: 'Issued' },
      {
        $set: {
          status: 'Returned',
          returnDate: todayUTC,
          fine,
        },
      },
      { new: true }
    );

    if (!updatedLoan) {
      return sendError(res, 400, 'This loan has already been returned');
    }

    const book = await Book.findById(updatedLoan.book);
    if (book && book.availableCopies < book.totalCopies) {
      book.availableCopies += 1;
      await book.save();
    }

    return sendSuccess(res, 200, 'Book returned successfully', {
      loan: formatLoanWithOverdue(updatedLoan, todayUTC),
      book,
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to return book');
  }
};

const getBookLoans = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid book ID');
    }

    const book = await Book.findById(id);
    if (!book) {
      return sendError(res, 404, 'Book not found');
    }

    const todayUTC = getTodayUTC();
    const loans = await Loan.find({ book: book._id }).sort({
      status: 1,
      issueDate: -1,
      createdAt: -1,
    });

    const formattedLoans = loans.map((loan) => formatLoanWithOverdue(loan, todayUTC));

    return sendSuccess(res, 200, 'Loan history fetched successfully', {
      book,
      loans: formattedLoans,
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch loan history');
  }
};

module.exports = {
  issueBook,
  returnBook,
  getBookLoans,
};
