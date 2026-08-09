import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => {
    const route = Array.isArray(children)
      ? children.find((child) => child.props.path === '/')
      : children;
    return route ? route.props.element : null;
  },
  Route: () => null,
  Link: ({ children, to, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null }),
}), { virtual: true });

jest.mock("./utils/faceRecognition", () => ({
  collectFaceDescriptors: jest.fn(),
  findBestFaceMatch: jest.fn(),
  getFaceDescriptor: jest.fn(),
  loadFaceRecognitionModels: jest.fn(() => Promise.resolve()),
}));

test('renders the role selection dashboard', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<App />);
  });

  expect(container.textContent).toContain('Login as Admin');
  expect(container.textContent).toContain('Login as User');

  act(() => {
    root.unmount();
  });
  document.body.removeChild(container);
});
