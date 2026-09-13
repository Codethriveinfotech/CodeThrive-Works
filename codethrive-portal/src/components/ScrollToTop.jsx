import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) mainWrapper.scrollTop = 0;

    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
