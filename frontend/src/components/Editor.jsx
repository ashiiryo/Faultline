import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useStore } from '../store';

// Simple textarea-based editor for improved readability and fewer runtime dependencies
const Editor = ({ value, onChange, placeholder, language = 'JavaScript' }) => {
  const ref = useRef(null);

  useEffect(() => {
    // expose a simple ref to store if necessary
    try {
      const setEditorRef = useStore.getState().setEditorRef;
      if (setEditorRef) setEditorRef({ element: ref.current });
    } catch (e) {}
  }, []);

  return (
    <Wrap>
      <TextArea
        ref={ref}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="code-editor"
      />
    </Wrap>
  );
};

const Wrap = styled.div`flex:1; min-height:0; display:flex; flex-direction:column;`;

const TextArea = styled.textarea`
  width: 100%; flex: 1; min-height: 300px; resize: vertical; outline: none; border: 1px solid rgba(255,255,255,0.06);
  background: #0b0f14; color: #e6edf3; font-family: monospace; font-size: 13px; padding: 12px; border-radius: 8px;
  caret-color: #e6edf3; line-height: 1.5; white-space: pre; overflow: auto;
  :focus { box-shadow: 0 0 0 3px rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.12); }
`;

export default Editor;
