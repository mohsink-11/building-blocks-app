import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Preview from '@/pages/Preview';

beforeEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});

describe('Preview initial assignment loading', () => {
  it('initializes columnGroups and mappedSources from sessionStorage', async () => {
    const preview = {
      fileName: 'file.xlsx',
      sourceColumns: [{ id: 's1', name: 'Unit' }, { id: 's2', name: 'Description' }],
      targetColumns: [
        { id: 't1', name: 'CUSTID', mappedColumns: ['s1'] },
        { id: 't2', name: 'DESCP', mappedColumns: ['s2'] }
      ],
      columnGroups: { t1: ['Assembly'], t2: ['Spare'] },
      mappedSources: { t1: ['s1'], t2: ['s2'] },
      columnBaseColumn: { t2: 's1' }
    };

    sessionStorage.setItem('previewData', JSON.stringify(preview));

    render(
      <MemoryRouter initialEntries={["/preview/p1"]}>
        <Routes>
          <Route path="/preview/:projectId" element={<Preview />} />
        </Routes>
      </MemoryRouter>
    );

    // Find the 'Spare' checkbox and ensure it's checked and associated with DESCP
    const spareCheckboxes = await screen.findAllByLabelText('Spare');
    let spareCheckbox: HTMLInputElement | undefined;
    for (const cb of spareCheckboxes) {
      let node: HTMLElement | null = cb as HTMLElement;
      while (node && node !== document.body) {
        if (node.textContent && node.textContent.includes('DESCP')) {
          spareCheckbox = cb as HTMLInputElement;
          break;
        }
        node = node.parentElement;
      }
      if (spareCheckbox) break;
    }
    expect(spareCheckbox).toBeDefined();
    // Debugging info: log the found checkbox and ancestor snippets
    // console output will help determine which checkbox instance was selected
    // eslint-disable-next-line no-console
    console.log('spareCheckbox outerHTML:', spareCheckbox!.outerHTML);
    let dbgNode: HTMLElement | null = spareCheckbox as HTMLElement;
    for (let i = 0; i < 5 && dbgNode && dbgNode !== document.body; i++) {
      // eslint-disable-next-line no-console
      console.log(`ancestor ${i}:`, dbgNode.tagName, dbgNode.className, 'textSnippet:', (dbgNode.textContent || '').slice(0, 80));
      dbgNode = dbgNode.parentElement;
    }

    expect(spareCheckbox!.checked).toBe(true);

    // Walk up to find first container that includes DESCP and ensure mapped source exists
    let node: HTMLElement | null = spareCheckbox as HTMLElement;
    let descpContainer: HTMLElement | undefined;
    while (node && node !== document.body) {
      if (node.textContent && node.textContent.includes('DESCP')) {
        descpContainer = node;
        break;
      }
      node = node.parentElement;
    }
    expect(descpContainer).toBeDefined();
    const { getByText } = within(descpContainer!);
    expect(getByText('Description')).toBeTruthy();

    // For CUSTID ensure Assembly is checked and associated with CUSTID
    const assemblyCheckboxes = await screen.findAllByLabelText('Assembly');
    let assemblyCheckbox: HTMLInputElement | undefined;
    for (const cb of assemblyCheckboxes) {
      node = cb as HTMLElement;
      while (node && node !== document.body) {
        if (node.textContent && node.textContent.includes('CUSTID')) {
          assemblyCheckbox = cb as HTMLInputElement;
          break;
        }
        node = node.parentElement;
      }
      if (assemblyCheckbox) break;
    }
    expect(assemblyCheckbox).toBeDefined();
    expect(assemblyCheckbox!.checked).toBe(true);
  });
});