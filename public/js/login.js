import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  const result = await Swal.fire({
    title: 'Log out?',
    text: 'You will be redirected to the home page.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#55c57a',
    cancelButtonColor: '#aaa',
    confirmButtonText: 'Yes, log me out',
    cancelButtonText: 'Cancel',
  });

  if (!result.isConfirmed) return;

  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    if (res.data.status === 'success') location.assign('/');
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
