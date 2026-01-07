import React from 'react';
import styled from 'styled-components';
import { useStore } from '../store';

export default function StatusBar(){
  const issues = useStore(s => s.issues || []);
  const loading = useStore(s => s.loading);
  const total = issues.length;
  const high = issues.filter(i=>i.severity==='high').length;
  const medium = issues.filter(i=>i.severity==='medium').length;
  const low = issues.filter(i=>i.severity==='low').length;

  return (
    <Wrap>
      <div className="left">{loading ? 'Analyzing…' : (total ? `${total} findings` : 'No findings')}</div>
      <div className="right">
        {high>0 && <span className="pill high">{high} high</span>}
        {medium>0 && <span className="pill medium">{medium} medium</span>}
        {low>0 && <span className="pill low">{low} low</span>}
      </div>
    </Wrap>
  );
}

const Wrap = styled.div`
  display:flex; justify-content:space-between; align-items:center; gap:12px; padding:8px 10px; width:100%;
  color: ${p=>p.theme.lowText}; font-size:13px; border-radius:8px; margin-bottom:12px;
  .pill{ margin-left:8px; padding:6px 8px; border-radius:8px; font-weight:600; font-size:12px }
  .high{ background: linear-gradient(180deg, rgba(255,122,89,0.12), rgba(255,90,51,0.06)); color:${p=>p.theme.accentAlt}; border:1px solid rgba(255,90,51,0.06)}
  .medium{ background: linear-gradient(180deg, rgba(246,200,106,0.06), rgba(240,173,43,0.02)); color:#F0AD2B; border:1px solid rgba(240,173,43,0.04)}
  .low{ background: linear-gradient(180deg, rgba(111,210,198,0.06), rgba(42,168,159,0.02)); color:${p=>p.theme.accent}; border:1px solid rgba(42,168,159,0.04)}
  .pill { transition: transform 120ms ease, box-shadow 120ms ease }
  .pill:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.4) }
`;
