const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your booking was successful! Please check your email for confirmation. If your booking doesn't show immediatly, please come back later.";

  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build Template
  // 3) Render that template using tour data from 1)

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data, for the requested tour  (including review and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  // 2) Check if the logged-in user has booked this tour and already reviewed it
  let hasBooked = false;
  let hasReviewed = false;

  const currentUser = res.locals.user;
  if (currentUser) {
    const booking = await Booking.findOne({
      tour: tour._id,
      user: currentUser._id,
    });
    hasBooked = !!booking;

    if (hasBooked) {
      const existing = await Review.findOne({
        tour: tour._id,
        user: currentUser._id,
      });
      hasReviewed = !!existing;
    }
  }

  // 3) Render template using data from 1)
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
    hasBooked,
    hasReviewed,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log in to your account',
  });
};

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Create your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.getMyReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user.id }).populate({
    path: 'tour',
    select: 'name imageCover slug',
  });

  res.status(200).render('myReviews', {
    title: 'My Reviews',
    reviews,
  });
});

exports.getForgotPasswordForm = (req, res) => {
  res.status(200).render('forgotPassword', {
    title: 'Forgot Password',
  });
};

exports.getResetPasswordForm = (req, res) => {
  res.status(200).render('resetPassword', {
    title: 'Reset Password',
    resetToken: req.params.token,
  });
};

// ── Admin pages ───────────────────────────────────────────────────────────────
const ADMIN_PAGE_LIMIT = 10;

exports.getAdminTours = catchAsync(async (req, res, next) => {
  const page = Math.max(1, req.query.page * 1 || 1);
  const limit = ADMIN_PAGE_LIMIT;
  const skip = (page - 1) * limit;
  const search = (req.query.search || '').trim();

  const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

  const [tours, total] = await Promise.all([
    Tour.find(filter)
      .select('name slug duration difficulty price ratingsAverage ratingsQuantity maxGroupSize imageCover summary')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Tour.countDocuments(filter),
  ]);

  res.status(200).render('adminTours', {
    title: 'Manage Tours',
    tours,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    search,
  });
});

exports.getAdminUsers = catchAsync(async (req, res, next) => {
  const page = Math.max(1, req.query.page * 1 || 1);
  const limit = ADMIN_PAGE_LIMIT;
  const skip = (page - 1) * limit;
  const search = (req.query.search || '').trim();

  const filter = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email photo role')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).render('adminUsers', {
    title: 'Manage Users',
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    search,
  });
});

exports.getAdminReviews = catchAsync(async (req, res, next) => {
  const page = Math.max(1, req.query.page * 1 || 1);
  const limit = ADMIN_PAGE_LIMIT;
  const skip = (page - 1) * limit;
  const search = (req.query.search || '').trim();

  // Filter is applied after populate — use aggregation-style approach:
  // fetch all matching populated docs and slice (simpler than $lookup for now)
  // For search we pre-filter by matching tour names or review text via regex
  const reviewFilter = search ? { review: { $regex: search, $options: 'i' } } : {};

  const [reviews, total] = await Promise.all([
    Review.find(reviewFilter)
      .populate({ path: 'user', select: 'name photo' })
      .populate({ path: 'tour', select: 'name' })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Review.countDocuments(reviewFilter),
  ]);

  res.status(200).render('adminReviews', {
    title: 'Manage Reviews',
    reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    search,
  });
});

exports.getAdminBookings = catchAsync(async (req, res, next) => {
  const page = Math.max(1, req.query.page * 1 || 1);
  const limit = ADMIN_PAGE_LIMIT;
  const skip = (page - 1) * limit;
  const search = (req.query.search || '').trim();

  // For bookings we search by user name after populate — simpler to use aggregation
  // Build a base query; user/tour search is handled via JS after populate (small sets)
  const [bookings, total] = await Promise.all([
    Booking.find()
      .populate({ path: 'user', select: 'name photo' })
      .populate({ path: 'tour', select: 'name' })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(),
  ]);

  // Apply in-memory filter for search (user/tour name — populated fields)
  const filtered = search
    ? bookings.filter((b) => {
      const uName = b.user ? b.user.name.toLowerCase() : '';
      const tName = b.tour ? b.tour.name.toLowerCase() : '';
      return uName.includes(search.toLowerCase()) || tName.includes(search.toLowerCase());
    })
    : bookings;

  res.status(200).render('adminBookings', {
    title: 'Manage Bookings',
    bookings: filtered,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    search,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
