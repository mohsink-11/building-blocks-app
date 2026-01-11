import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Mapping from '@/pages/Mapping';
import * as authHook from '@/hooks/useAuth';

beforeEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.spyOn(authHook, 'useAuth').mockReturnValue({ user: { id: 'u1' }, session: { access_token: 't1' }, loading: false, signIn: async () => ({}), signUp: async () => ({}), signInWithProvider: async () => ({}), signOut: async () => ({}) } as any);
});

describe('Mapping -> Preview link behavior', () => {
  it('merges previewData instead of overwriting so assignments are preserved', async () => {
    // initial previewData (user saved assignments earlier)
    const initialPreview = {
      fileName: 'file.xlsx',
      sourceColumns: [{ id: 's1', name: 'Unit' }, { id: 's2', name: 'Description' }],
      targetColumns: [
        { id: 't1', name: 'Ident', mappedColumns: [] },
        { id: 't2', name: 'DESCP', mappedColumns: ['s2'] }
      ],
      columnGroups: { t2: ['Spare'] },
      mappedSources: { t2: ['s2'] }
    };

    sessionStorage.setItem('previewData', JSON.stringify(initialPreview));

    const mappingState = {
      projectName: 'New',
      fileName: 'file.xlsx',
      sourceColumns: initialPreview.sourceColumns,
      targetColumns: [
        { id: 't1', name: 'Ident', mappedColumns: ['s1'] },
        { id: 't2', name: 'DESCP', mappedColumns: ['s1'] }
      ],
      rows: []
    };

    sessionStorage.setItem('mappingData', JSON.stringify(mappingState));

    render(
      <MemoryRouter initialEntries={["/mapping/new"]}>
        <Routes>
          <Route path="/mapping/:projectId" element={<Mapping />} />
        </Routes>
      </MemoryRouter>
    );

    // find the Preview Data link and click it
    const previewLink = screen.getByRole('link', { name: /Preview Data/i });
    expect(previewLink).toBeTruthy();

    fireEvent.click(previewLink);

    const raw = sessionStorage.getItem('previewData');
    expect(raw).toBeTruthy();
    const updated = JSON.parse(raw!);

    // ensure targetColumns reflect mapping state
    expect(updated.targetColumns).toEqual(mappingState.targetColumns);

    // ensure original assignment (Spare) is preserved
    expect(updated.columnGroups).toEqual(initialPreview.columnGroups);
    expect(updated.mappedSources).toEqual(initialPreview.mappedSources);
  });
});
