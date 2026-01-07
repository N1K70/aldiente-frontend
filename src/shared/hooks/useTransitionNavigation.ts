import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { usePageTransition } from '../context/PageTransitionContext';

type NavigateOptions = {
  event?: React.MouseEvent<HTMLElement>;
  element?: HTMLElement | null;
  coordinates?: { x: number; y: number };
};

export const useTransitionNavigation = () => {
  const history = useHistory();
  const { captureOrigin, setOrigin } = usePageTransition();

  const setCoordinates = useCallback(
    (coordinates?: { x: number; y: number }) => {
      if (coordinates) {
        setOrigin(coordinates);
      } else {
        setOrigin(null);
      }
    },
    [setOrigin]
  );

  const navigate = useCallback(
    (path: string, options?: NavigateOptions) => {
      if (options?.event) {
        const target = options.event.currentTarget as HTMLElement | null;
        captureOrigin(target);
      } else if (options?.element) {
        captureOrigin(options.element);
      } else if (options?.coordinates) {
        setCoordinates(options.coordinates);
      } else {
        captureOrigin(null);
      }

      history.push(path);
    },
    [captureOrigin, history, setCoordinates]
  );

  const navigateFromEvent = useCallback(
    (path: string) => (event: React.MouseEvent<HTMLElement>) => {
      navigate(path, { event });
    },
    [navigate]
  );

  const navigateFromElement = useCallback(
    (path: string, element: HTMLElement | null) => {
      navigate(path, { element });
    },
    [navigate]
  );

  const navigateFromCoordinates = useCallback(
    (path: string, coordinates: { x: number; y: number }) => {
      navigate(path, { coordinates });
    },
    [navigate]
  );

  return {
    navigate,
    navigateFromEvent,
    navigateFromElement,
    navigateFromCoordinates,
  };
};

export default useTransitionNavigation;
