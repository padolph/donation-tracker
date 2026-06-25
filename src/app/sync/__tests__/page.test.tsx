import { render, screen } from '@testing-library/react';
import SyncPage from '../page';

jest.mock('../SyncClient', () => {
  return function DummySyncClient() {
    return <div data-testid="sync-client">Sync Client Rendered</div>;
  };
});

describe('SyncPage', () => {
  it('renders SyncClient correctly', () => {
    render(<SyncPage />);
    expect(screen.getByTestId('sync-client')).toHaveTextContent('Sync Client Rendered');
  });
});
