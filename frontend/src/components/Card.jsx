import React from 'react';
import styled from 'styled-components';

// Modern Card wrapper for editor area. Replaced terminal aesthetic with
// a minimal, clean card suitable for a code editor container.

const Card = ({ children, tabs }) => {
  return (
    <StyledWrapper>
      <div className="container">
        <div className="toolbar">
          <div className="title">Editor</div>
          {tabs ? <div style={{display:'flex', gap:8, alignItems:'center'}}>{tabs}</div> : null}
        </div>
        <div className="body">
          {children}
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .container { width:100%; height:100%; display:flex; flex-direction:column }
  .toolbar { display:flex; align-items:center; gap:12px; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.03); background: linear-gradient(180deg,#26292d,#232527); border-top-left-radius:8px; border-top-right-radius:8px }
  .toolbar .title { color:#e6eef0; font-weight:600 }
  .body { padding:12px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border-bottom-left-radius:8px; border-bottom-right-radius:8px; height: 100%; }
`;

export default Card;
