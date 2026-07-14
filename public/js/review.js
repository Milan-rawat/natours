import axios from 'axios';
import { showAlert } from './alerts';

// ── Delete a review ──────────────────────────────────────────────────────────
export const deleteReview = async (reviewId) => {
    try {
        await axios({
            method: 'DELETE',
            url: `/api/v1/reviews/${reviewId}`,
        });

        showAlert('success', 'Review deleted successfully!');

        // Remove the card from the DOM without a full reload
        const card = document.querySelector(`.my-review-card[data-review-id="${reviewId}"]`);
        if (card) card.remove();

        // Show empty state if no cards remain
        if (!document.querySelector('.my-review-card')) {
            const list = document.querySelector('.my-reviews-list');
            if (list) list.innerHTML = '<p class="reviews-empty">No reviews yet. Book a tour and share your experience!</p>';
        }
    } catch (err) {
        showAlert('error', err.response?.data?.message || 'Could not delete review.');
    }
};

// ── Update a review ──────────────────────────────────────────────────────────
export const updateReview = async (reviewId, reviewText, rating) => {
    try {
        await axios({
            method: 'PATCH',
            url: `/api/v1/reviews/${reviewId}`,
            data: { review: reviewText, rating },
        });

        showAlert('success', 'Review updated successfully!');

        // Update the view-mode card in place
        const viewEl = document.querySelector(`.my-review-card__view[data-review-id="${reviewId}"]`);
        if (viewEl) {
            // Update stars
            viewEl.querySelectorAll('.reviews__star').forEach((star, idx) => {
                star.classList.toggle('reviews__star--active', idx < rating);
                star.classList.toggle('reviews__star--inactive', idx >= rating);
            });
            // Update text
            const textEl = viewEl.querySelector('.my-review-card__text');
            if (textEl) textEl.textContent = reviewText;
        }

        // Also update the edit-mode textarea and stars for next edit
        const editEl = document.querySelector(`.my-review-card__edit[data-review-id="${reviewId}"]`);
        if (editEl) {
            const textarea = editEl.querySelector('textarea');
            if (textarea) textarea.value = reviewText;
            editEl.querySelectorAll('.edit-star').forEach((star, idx) => {
                star.classList.toggle('reviews__star--active', idx < rating);
                star.classList.toggle('reviews__star--inactive', idx >= rating);
            });
            editEl.dataset.currentRating = rating;
        }

        switchToView(reviewId);
    } catch (err) {
        showAlert('error', err.response?.data?.message || 'Could not update review.');
    }
};

// ── Toggle edit / view mode ───────────────────────────────────────────────────
export const switchToEdit = (reviewId) => {
    const view = document.querySelector(`.my-review-card__view[data-review-id="${reviewId}"]`);
    const edit = document.querySelector(`.my-review-card__edit[data-review-id="${reviewId}"]`);
    const editBtn = document.querySelector(`.btn--edit-review[data-review-id="${reviewId}"]`);
    if (view) view.style.display = 'none';
    if (edit) edit.style.display = 'block';
    if (editBtn) editBtn.style.display = 'none';
};

export const switchToView = (reviewId) => {
    const view = document.querySelector(`.my-review-card__view[data-review-id="${reviewId}"]`);
    const edit = document.querySelector(`.my-review-card__edit[data-review-id="${reviewId}"]`);
    const editBtn = document.querySelector(`.btn--edit-review[data-review-id="${reviewId}"]`);
    if (view) view.style.display = 'block';
    if (edit) edit.style.display = 'none';
    if (editBtn) editBtn.style.display = 'inline-block';
};

// ── Interactive star rating in edit mode ─────────────────────────────────────
const initEditStars = () => {
    document.querySelectorAll('.edit-star-rating').forEach((ratingEl) => {
        let selectedRating = parseInt(ratingEl.dataset.currentRating, 10) || 0;
        const stars = ratingEl.querySelectorAll('.edit-star');

        const highlightStars = (upTo) => {
            stars.forEach((s, idx) => {
                s.classList.toggle('reviews__star--active', idx < upTo);
                s.classList.toggle('reviews__star--inactive', idx >= upTo);
            });
        };

        stars.forEach((star) => {
            star.addEventListener('mouseover', () => highlightStars(+star.dataset.value));
            star.addEventListener('mouseout', () => highlightStars(selectedRating));
            star.addEventListener('click', () => {
                selectedRating = +star.dataset.value;
                ratingEl.dataset.currentRating = selectedRating;
                highlightStars(selectedRating);
            });
        });
    });
};

// ── Wire up all event listeners ───────────────────────────────────────────────
export const initReviewHandlers = () => {
    const reviewsPage = document.querySelector('.my-reviews-list');
    if (!reviewsPage) return;

    initEditStars();

    // Event delegation on the list container
    reviewsPage.addEventListener('click', async (e) => {
        // Delete button
        const deleteBtn = e.target.closest('.btn--delete-review');
        if (deleteBtn) {
            if (!confirm('Are you sure you want to delete this review?')) return;
            const { reviewId } = deleteBtn.dataset;
            await deleteReview(reviewId);
            return;
        }

        // Edit button
        const editBtn = e.target.closest('.btn--edit-review');
        if (editBtn) {
            const { reviewId } = editBtn.dataset;
            switchToEdit(reviewId);
            return;
        }

        // Cancel button
        const cancelBtn = e.target.closest('.btn--cancel-review');
        if (cancelBtn) {
            const { reviewId } = cancelBtn.dataset;
            switchToView(reviewId);
            return;
        }

        // Save button
        const saveBtn = e.target.closest('.btn--save-review');
        if (saveBtn) {
            const { reviewId } = saveBtn.dataset;
            const editEl = document.querySelector(`.my-review-card__edit[data-review-id="${reviewId}"]`);
            const reviewText = editEl.querySelector('textarea').value.trim();
            const ratingEl = editEl.querySelector('.edit-star-rating');
            const rating = parseInt(ratingEl.dataset.currentRating, 10);

            if (!reviewText) return showAlert('error', 'Review text cannot be empty.');
            if (!rating || rating < 1 || rating > 5) return showAlert('error', 'Please select a rating between 1 and 5.');

            saveBtn.textContent = 'Saving...';
            await updateReview(reviewId, reviewText, rating);
            saveBtn.textContent = 'Save';
        }
    });
};
