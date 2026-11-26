const mongoose = require('mongoose');

const CATEGORIES = [
  'Fiction',
  'Science',
  'History',
  'Technology',
  'Biography',
  'Other',
];

const ISBN_REGEX = /^(?:\d{10}|\d{13})$/;

const bookSchema = new mongoose.Schema(
  {
    bookCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      validate: {
        validator: (value) => ISBN_REGEX.test(value),
        message: 'ISBN must contain exactly 10 or 13 digits',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: 'Category must be one of: Fiction, Science, History, Technology, Biography, Other',
      },
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'Total copies must be between 1 and 20'],
      max: [20, 'Total copies must be between 1 and 20'],
      validate: {
        validator: Number.isInteger,
        message: 'Total copies must be a whole number',
      },
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be below 0'],
      max: [20, 'Available copies cannot exceed 20'],
      validate: [
        {
          validator: Number.isInteger,
          message: 'Available copies must be a whole number',
        },
        {
          validator: function (value) {
            return value <= this.totalCopies;
          },
          message: 'Available copies cannot exceed total copies',
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  Book: mongoose.model('Book', bookSchema),
  CATEGORIES,
  ISBN_REGEX,
};
