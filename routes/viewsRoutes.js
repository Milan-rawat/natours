const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(viewsController.alerts)

router.get('/', authController.isLoggedIn, viewsController.getOverview);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/signup', authController.isLoggedIn, viewsController.getSignupForm);
router.get('/forgot-password', viewsController.getForgotPasswordForm);
router.get('/reset-password/:token', viewsController.getResetPasswordForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-reviews', authController.protect, viewsController.getMyReviews);
router.get(
  '/my-tours',
  bookingController.createBookingCheckout,
  authController.protect,
  viewsController.getMyTours
);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

// Admin routes — protected + restricted to admin only
router.use('/admin', authController.protect, authController.restrictTo('admin'));
router.get('/admin/tours', viewsController.getAdminTours);
router.get('/admin/users', viewsController.getAdminUsers);
router.get('/admin/reviews', viewsController.getAdminReviews);
router.get('/admin/bookings', viewsController.getAdminBookings);

module.exports = router;
