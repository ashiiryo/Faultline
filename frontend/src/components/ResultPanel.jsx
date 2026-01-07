import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
export default function ResultPanel() {
  const issues = useStore(s => s.issues || []);
  const highlightLine = useStore(s => s.highlightLine);

  const grouped = useMemo(() => {
    const out = { high: [], medium: [], low: [] };
    for (const it of issues) {
      const sev = it.severity || 'low';
      out[sev] = out[sev] || [];
      out[sev].push(it);
    }
    return out;
  }, [issues]);

  const empty = issues.length === 0;

  function SeverityIcon({s}){
    if (s === 'high') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ff7a59"/></svg>;
    if (s === 'medium') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#f6c86a"/></svg>;
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#6fd2c6"/></svg>;
  }

  return (
    <Wrap>
      <AnimatePresence>
        <Panel as={motion.div} initial={{ x: 12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 12, opacity: 0 }}>
          <h3>Findings</h3>
          {empty ? (
            <div className="empty">No findings yet. Click <strong>Analyze</strong> to run the check.</div>
          ) : (
            <div className="list">
              {['high','medium','low'].map(level => (
                grouped[level] && grouped[level].length > 0 && (
                  <section key={level} className={`group ${level}`}>
                    <div className="groupHeader"><span className="label">{level.toUpperCase()}</span> <span className="count">{grouped[level].length}</span></div>
                    {grouped[level].map((it, idx) => (
                      <Card key={idx} as={motion.div} whileHover={{ scale: 1.01 }} onClick={() => { if (it.line) highlightLine(it.line); }} tabIndex={0}>
                        <div className="head">
                          <div className="icon"><SeverityIcon s={level} /></div>
                          <div className="title_wrap">
                            <strong className="title">{it.title}</strong>
                            <div className="meta">{it.line ? `line ${it.line}` : ''} {it.ruleId ? <span className="rule">{it.ruleId}</span> : null}</div>
                          </div>
                        </div>
                        <p className="explain">{it.explanation}</p>
                        {it.suggestedFix && <p className="fix">Suggestion: {it.suggestedFix}</p>}
                      </Card>
                    ))}
                  </section>
                )
              ))}
            </div>
          )}
        </Panel>
      </AnimatePresence>
    </Wrap>
  );
}

const Wrap = styled.div`width:100%; padding-top:14px;`;
const Panel = styled.div`
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  padding: 12px; border-radius:12px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); min-height: 220px; margin-top:18px; width:100%;
  display:flex; flex-direction:column; flex:1; min-height:0;
  h3 { margin:0 0 8px 0; font-weight:600 }
  .empty { color:${p=>p.theme.lowText}; padding:18px; font-size:13px }
  .list { overflow:auto; flex:1; min-height:0 }
  .group { margin-bottom:10px }
  .groupHeader { display:flex; align-items:center; gap:8px; margin-bottom:8px }
  .group .label { font-size:12px; font-weight:700; color:#dfe7e7 }
  .group .count { font-size:12px; color:${p=>p.theme.lowText} }
`;
const Card = styled.div`
  padding: 12px; border-radius:10px; margin-bottom:10px; background: #232426; border: 1px solid rgba(255,255,255,0.03);
  cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,0.5); transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
  :hover, :focus { transform: translateY(-6px); box-shadow: 0 20px 52px rgba(0,0,0,0.6); outline: none; background:#2a2d31 }
  .head { display:flex; gap:12px; align-items:flex-start }
  .icon { width:18px; height:18px; margin-top:2px }
  :hover .icon svg { transform: scale(1.08); transition: transform 140ms ease }
  .title_wrap { display:flex; flex-direction:column }
  .title { font-size:14px; color:#fff }
  .meta { font-size:12px; color:${p=>p.theme.lowText}; margin-top:4px }
  .rule { margin-left:8px; opacity:0.8; font-size:11px; color:#b7c6c4 }
  .explain { margin:8px 0 0 0; font-size:13px; color:${p=>p.theme.text} }
  .fix { margin:6px 0 0 0; font-size:12px; color:${p=>p.theme.lowText} }
`;
