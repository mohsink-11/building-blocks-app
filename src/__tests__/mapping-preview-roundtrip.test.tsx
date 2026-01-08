import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Mapping from '@/pages/Mapping';
import * as api from '@/integrations/supabase/api';
import * as authHook from '@/hooks/useAuth';

beforeEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');

  // Mock authenticated user with a session
  vi.spyOn(authHook, 'useAuth').mockReturnValue({ user: { id: 'u1' }, session: { access_token: 't1' }, loading: false, signIn: async () => ({}), signUp: async () => ({}), signInWithProvider: async () => ({}), signOut: async () => ({}) } as any);
});

describe('Mapping ↔ Preview roundtrip', () => {
  it('merges updated mapping into previewData while preserving assignments', async () => {
    const createMock = vi.spyOn(api, 'createProject').mockResolvedValue({ data: { id: 'p-new', name: 'New' }, error: null } as any);

    const initialPreview = {
      fileName: 'file.xlsx',
      sourceColumns: [{ id: 's1', name: 'Unit' }, { id: 's2', name: 'Description' }],
      targetColumns: [
        { id: 't1', name: 'Ident', mappedColumns: [], delimiter: ' ' },
        { id: 't2', name: 'DESCP', mappedColumns: ['s2'], delimiter: ' ' }
      ],
      columnGroups: { t2: ['Spare'] },
      mappedSources: { t2: ['s2'] }
    };

    // Edited mapping: map Ident (t1) and change DESCP to map s1 instead
    const mappingEdited = {
      fileName: 'file.xlsx',
      sourceColumns: initialPreview.sourceColumns,
      targetColumns: [
        { id: 't1', name: 'Ident', mappedColumns: ['s1'], delimiter: ' ' },
        { id: 't2', name: 'DESCP', mappedColumns: ['s1'], delimiter: ' ' }
      ],
      rows: []
    };

    sessionStorage.setItem('previewData', JSON.stringify(initialPreview));
    sessionStorage.setItem('mappingData', JSON.stringify(mappingEdited));

    render(
      <MemoryRouter initialEntries={["/mapping/new"]}>
        <Routes>
          <Route path="/mapping/:projectId" element={<Mapping />} />
        </Routes>
      </MemoryRouter>
    );

    // click the visible save button
    const allBtns = screen.getAllByTestId('save-project');
    const saveBtn = allBtns.find((b: any) => !b.className.includes('hidden')) || allBtns[0];
    fireEvent.click(saveBtn);

    // wait for createProject to be called
    await waitFor(() => expect(createMock).toHaveBeenCalled(), { timeout: 2000 });

    // check previewData in sessionStorage was updated/merged
    const raw = sessionStorage.getItem('previewData');
    expect(raw).toBeTruthy();
    const updated = JSON.parse(raw!);

    // targetColumns should be updated to the edited mapping
    expect(updated.targetColumns).toEqual(mappingEdited.targetColumns);

    // original assignment fields should be preserved
    expect(updated.columnGroups).toEqual(initialPreview.columnGroups);
    expect(updated.mappedSources).toEqual(initialPreview.mappedSources);
  });
});
