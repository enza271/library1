const { Book } = require('../models/Book');
const Loan = require('../models/Loan');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getTodayUTC } = require('../utils/dateUtils');

const getStats = async (req, res) => {
  try {
    const todayUTC = getTodayUTC();

    const [bookAgg, issuedCopies, overdueLoans, fineAgg] = await Promise.all([
      Book.aggregate([
        {
          $group: {
            _id: null,
            totalTitles: { $sum: 1 },
            totalCopies: { $sum: '$totalCopies' },
          },
        },
      ]),
      Loan.countDocuments({ status: 'Issued' }),
      Loan.countDocuments({
        status: 'Issued',
        dueDate: { $lt: todayUTC },
      }),
      Loan.aggregate([
        { $match: { status: 'Returned' } },
        {
          $group: {
            _id: null,
            totalFineCollected: { $sum: '$fine' },
          },
        },
      ]),
    ]);

    const totalTitles = bookAgg[0]?.totalTitles || 0;
    const totalCopies = bookAgg[0]?.totalCopies || 0;
    const totalFineCollected = fineAgg[0]?.totalFineCollected || 0;

    return sendSuccess(res, 200, 'Statistics fetched successfully', {
      totalTitles,
      totalCopies,
      issuedCopies,
      overdueLoans,
      totalFineCollected,
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch statistics');
  }
};

module.exports = {
  getStats,
};
