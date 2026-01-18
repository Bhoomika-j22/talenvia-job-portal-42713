import { render, screen } from '@testing-library/react';
import App from './App';

test("renders Talenvia brand", () => {
  render(<App />);
  const brand = screen.getByText(/Talenvia/i);
  expect(brand).toBeInTheDocument();
});
