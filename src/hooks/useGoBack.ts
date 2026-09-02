import { useNavigate, useLocation } from 'react-router-dom';

export const useGoBack = (fallbackRoute = '/') => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    // location.key is 'default' for the very first entry in the browser history stack created by React Router
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(fallbackRoute, { replace: true });
    }
  };

  return goBack;
};
