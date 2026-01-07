import create from 'zustand'

export const useStore = create((set) => ({
  code: '',
  lang: 'JavaScript',
  issues: [],
  loading: false,
  editorRef: null,
  _decorations: [],
  setCode: (code) => set({ code }),
  setLang: (lang) => set({ lang }),
  setIssues: (issues) => set({ issues }),
  setLoading: (loading) => set({ loading }),
  setEditorRef: (ref) => set({ editorRef: ref }),
  highlightLine: (line) => set((state) => {
    const ref = state.editorRef;
    if (!ref || !line) return {};
    const { editor, mon } = ref;
    try {
      editor.revealPositionInCenter({ lineNumber: line, column: 1 });
      // apply a decoration
      const newDec = [{ range: new mon.Range(line,1,line,1), options: { isWholeLine: true, className: 'line-highlight-selected' } }];
      const ids = editor.deltaDecorations(state._decorations || [], newDec.map(d => ({ range: d.range, options: d.options })));
      return { _decorations: ids };
    } catch (e) {
      return {};
    }
  }),
  clearHighlights: () => set({ _decorations: [] }),
}));
