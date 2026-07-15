import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/signup',
            data: { name, email, password, passwordConfirm },
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Account created successfully! Welcome to Natours!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        const serverMessage = err.response?.data?.message || '';

        // MongoDB duplicate key error — email already registered
        if (
            err.response?.data?.error?.code === 11000 ||
            serverMessage.includes('duplicate key') ||
            serverMessage.includes('dup key')
        ) {
            showAlert('error', 'This email is already registered. Please log in instead.');
        } else {
            showAlert('error', serverMessage || 'Something went wrong. Please try again.');
        }
    }
};
