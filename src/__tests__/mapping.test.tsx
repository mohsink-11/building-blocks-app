import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Mapping from '@/pages/Mapping';
import * as api from '@/integrations/supabase/api';
import * as authHook from '@/hooks/useAuth';

beforeEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  // Reset URL/history between tests to avoid leaked pathname/state
  window.history.replaceState({}, '', '/');

  // Provide a mocked authenticated user *with a session* for save/create flows
  vi.spyOn(authHook, 'useAuth').mockReturnValue({ user: { id: 'u1' }, session: { access_token: 't1', token_type: 'bearer' }, loading: false, signIn: async () => ({}), signUp: async () => ({}), signInWithProvider: async () => ({}), signOut: async () => ({}) } as any);
});

describe('Mapping page save behavior', () => {
  it('calls updateProject when projectId present in URL', async () => {
    const updateMock = vi.spyOn(api, 'updateProject').mockResolvedValue({ data: { id: 'p1', name: 'Proj 1' }, error: null } as any);

    const mappingState = {
      projectName: 'Proj 1',
      fileName: 'file.xlsx',
      sourceColumns: [{ id: 's1', name: 'A' }],
      targetColumns: [{ id: 't1', name: 'Part', mappedColumns: ['s1'] }],
      rows: []
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/mapping/p1', state: mappingState }]}> 
        <Routes>
          <Route path="/mapping/:projectId" element={<Mapping />} />
        </Routes>
      </MemoryRouter>
    );

    const btns = await screen.findAllByRole('button', { name: /Save Project/i });
    expect(btns.length).toBeGreaterThan(0);

    fireEvent.click(btns[0]);

    // await a microtask tick for async handler
    await new Promise((r) => setTimeout(r, 10));

    expect(updateMock).toHaveBeenCalled();
  });

  it('calls createProject when path is /mapping/new and not update', async () => {
    const createMock = vi.spyOn(api, 'createProject').mockResolvedValue({ data: { id: 'p-new', name: 'New' }, error: null } as any);
    const updateMock = vi.spyOn(api, 'updateProject').mockResolvedValue({ data: { id: 'p1', name: 'Updated' }, error: null } as any);

    const mappingState = {
      projectName: 'New',
      fileName: 'file.xlsx',
      sourceColumns: [{ id: 's1', name: 'A' }],
      targetColumns: [{ id: 't1', name: 'Part', mappedColumns: ['s1'] }],
      rows: []
    };

// Persist mappingState into sessionStorage so Mapping reads it deterministically
    sessionStorage.setItem('mappingData', JSON.stringify(mappingState));

    render(
      <MemoryRouter initialEntries={["/mapping/new"]}>
        <Routes>
          <Route path="/mapping/:projectId" element={<Mapping />} />
        </Routes>
      </MemoryRouter>
    );

    // Use the test id to click the Save Project button to avoid ambiguity
    const allSaveBtns = screen.getAllByTestId('save-project');
    // Prefer the visible one (not using responsive 'hidden' class)
    const saveBtn = allSaveBtns.find((b: any) => !b.className.includes('hidden')) || allSaveBtns[0];
    expect(saveBtn).toBeTruthy();

    // Spy on console.log to assert the handler runs
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Clear any previous calls to ensure we only observe this click's handler
    logSpy.mockClear();

    // debug: ensure we clicked the intended element
    // eslint-disable-next-line no-console
    console.log('clicking save button class:', saveBtn.className);

    fireEvent.click(saveBtn);

    // Wait for handler to be invoked (confirm debug log)
    await waitFor(() => expect(logSpy).toHaveBeenCalled(), { timeout: 1000 });

    // Debug: print captured console.log calls to stderr so we can inspect them
    // eslint-disable-next-line no-console
    console.error('logSpy calls after click:', JSON.stringify(logSpy.mock.calls.slice(0, 10)));

    // Wait for the handler-specific log to appear (it may be asynchronous)
    await waitFor(() => {
      const found = logSpy.mock.calls.some((c: any) => typeof c[0] === 'string' && c[0].includes('saveProject handler invoked'));
      if (!found) throw new Error('handler log not yet present');
      return true;
    }, { timeout: 2000 });

    // Wait for createProject to be called (use waitFor for reliability)
    await waitFor(() => expect(createMock).toHaveBeenCalled(), { timeout: 2000 });

    expect(createMock).toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});