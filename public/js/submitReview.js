import axios from 'axios';
import { showAlert } from './alerts';

export const initReviewForm = () => {
    const form = document.getElementById('review-form');
    if (!form) return;

    const starsContainer = document.getElementById('review-stars');
    const ratingInput = document.getElementById('review-rating');
    const starIcons = starsContainer.querySelectorAll('.review-star-icon');
    let selectedRating = 0;

    // ── Interactive star input ───────────────────────────────────────────────
    const highlightStars = (upTo) => {
        starIcons.forEach((star, idx) => {
            star.classList.toggle('review-star-icon--active', idx < upTo);
            star.classList.toggle('review-star-icon--inactive', idx >= upTo);
        });
    };

    starIcons.forEach((star) => {
        star.addEventListener('mouseover', () => highlightStars(+star.dataset.value));
        star.addEventListener('mouseout', () => highlightStars(selectedRating));
        star.addEventListener('click', () => {
            selectedRating = +star.dataset.value;
            ratingInput.value = selectedRating;
            highlightStars(selectedRating);
        });
    });

    // ── Form submit ──────────────────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const tourId = form.dataset.tourId;
        const review = document.getElementById('review-text').value.trim();
        const rating = parseInt(ratingInput.value, 10);
        const submitBtn = document.getElementById('btn-submit-review');

        if (!review) return showAlert('error', 'Please write your review.');
        if (!rating || rating < 1 || rating > 5)
            return showAlert('error', 'Please select a rating between 1 and 5.');

        try {
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            await axios({
                method: 'POST',
                url: `/api/v1/tours/${tourId}/reviews`,
                data: { review, rating },
            });

            showAlert('success', 'Review submitted successfully! Thank you.');

            // Reload after a short delay so the new review appears in the list
            window.setTimeout(() => location.reload(), 1500);
        } catch (err) {
            submitBtn.textContent = 'Submit Review';
            submitBtn.disabled = false;
            showAlert('error', err.response?.data?.message || 'Could not submit review.');
        }
    });
};
