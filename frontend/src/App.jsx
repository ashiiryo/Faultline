import React, { useEffect, useState } from "react";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";
import theme from "./theme";
import { analyze } from "../../analyzer.js";

const defaultCode = `function getUsername(user) {\n  return user.profile.name.toLowerCase();\n}`;
const pyExample = `def get_username(user):\n    return user.get('profile').get('name').lower()`;
const jsExample = defaultCode;

const LoadingScreen = ({ show }) => (
  <LoaderOverlay show={show}>
    <Spinner />
  </LoaderOverlay>
);

const Spinner = () => (
  <div className="loader">
    <span />
  </div>
);

const App = () => {
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState("javascript");
  const [findings, setFindings] = useState([]);
  const [analyzeMeta, setAnalyzeMeta] = useState({});
  const [analyzeError, setAnalyzeError] = useState(null);
  
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  async function handleAnalyze() {
    setAnalyzeError(null);
    setFindings([]);
    const start = Date.now();
    try {
      const result = await analyze(code, language);
      setAnalyzeMeta(result && result.meta ? result.meta : { durationMs: Date.now() - start });
      if (result.meta && result.meta.error) {
        setAnalyzeError(result.meta.error);
        setFindings([]);
      } else if (Array.isArray(result.findings) && result.findings.length) {
        setFindings(result.findings);
      } else {
        setFindings([]);
      }
    } catch (e) {
      setAnalyzeError((e && e.message) || "Analysis failed");
      setAnalyzeMeta({ durationMs: Date.now() - start, error: (e && e.message) || "Analysis failed" });
      setFindings([]);
    }
  }

  function handleExample() {
    const example = language === "python" ? pyExample : jsExample;
    setCode(example);
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(findings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "faultline-findings.json";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Page>
        <Header>
          <Title>Faultline</Title>
        </Header>
        <LoadingScreen show={loading} />
        {!loading && (
          <Main>
            <LeftPanel>
              <LangToggle>
                <LangBtn active={language === "javascript"} onClick={() => setLanguage("javascript")}>JavaScript</LangBtn>
                <LangBtn active={language === "python"} onClick={() => setLanguage("python")}>Python</LangBtn>
              </LangToggle>
              <StyledTextarea
                value={code}
                placeholder={`Write ${language} code here...`}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                rows={14}
                aria-label="code-editor"
                data-testid="code-input"
              />
            </LeftPanel>
            <RightPanel>
              <BtnBar>
                <AnalyzeBtn onClick={handleAnalyze}>Analyze</AnalyzeBtn>
                <ClearBtn onClick={() => { setFindings([]); setAnalyzeError(null); }}>Clear</ClearBtn>
                <SimpleBtn onClick={handleExample}>Example</SimpleBtn>
                <SimpleBtn onClick={handleExport} disabled={findings.length === 0}>Export</SimpleBtn>
              </BtnBar>
              <FindingsPanel>
                <h3>Findings</h3>
                {analyzeError && (
                  <ErrorMsg>Analyzer error: {analyzeError}</ErrorMsg>
                )}
                {!analyzeError && findings.length === 0 && (
                  <InfoMsg>No findings. Click <b>Analyze</b> to run the check.</InfoMsg>
                )}
                <ul>
                  {findings.map((f, i) => (
                    <Finding key={i} severity={f.severity}>
                      <b>[{f.severity || "INFO"}]</b> {f.message || f.title || "No message."} {f.line != null ? <span> (line {f.line})</span> : null}
                    </Finding>
                  ))}
                </ul>
              </FindingsPanel>
            </RightPanel>
          </Main>
        )}
      </Page>
    </ThemeProvider>
  );
};

const GlobalStyles = createGlobalStyle`
  html,body,#root { height:100%; margin:0; padding:0; background:#0b0f14; color:#e6edf3; font-family:Inter,Arial,sans-serif; }
  * { box-sizing: border-box; }
  .loader {
    width:120px; height:90px; display:flex; align-items:center; justify-content:center;
    position:relative; margin:40px auto;
  }
  .loader span { position:absolute; left:50px; bottom:30px; width:30px; height:30px; background:#2aa89f; border-radius:50%; animation:loading-bounce 0.5s alternate infinite; }
  @keyframes loading-bounce { 0% { transform: scale(1, .7);} 40% { transform: scale(.8, 1.2);} 60% { transform:scale(1,1);} 100% { bottom:140px;} }
`;

const Page = styled.div`
  min-height: 100vh; width: 100vw; background: #0b0f14; display: flex; flex-direction: column;
`;
const Header = styled.header`
  height: 56px; background: #080b0f; display:flex; flex-direction:column; justify-content:center; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);
`;
const Title = styled.h1`
  margin: 0; color: #e6edf3; font-size: 20px; font-weight: 800; letter-spacing:0.1em;
`;
const Main = styled.div`
  flex:1; display:flex; flex-direction:row; align-items:flex-start; justify-content:center; padding: 26px;
`;
const LeftPanel = styled.div`
  width: 60%; max-width:520px; min-width:330px; margin-right:38px; display:flex; flex-direction:column;
`;
const RightPanel = styled.div`
  width: 30%; min-width:250px; display:flex; flex-direction:column; padding:16px 20px 28px 12px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.00)); border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.13);
`;
const BtnBar = styled.div`
  display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap;
`;
const LangToggle = styled.div`
  display:flex; gap:8px; margin-bottom:8px;
`;
const LangBtn = styled.button`
  padding: 8px 12px; border-radius:8px; background: ${p => p.active ? "rgba(42,168,159,0.13)" : "transparent"}; color: #e6edf3; border: 1px solid rgba(255,255,255,0.04); cursor: pointer; font-weight:600; outline:none;
`;
const StyledTextarea = styled.textarea`
  width: 100%; min-height: 300px; resize: vertical; outline: none; border: 1px solid rgba(255,255,255,0.07); background: #0b0f14; color: #e6edf3; font-family: monospace; font-size: 13px; padding: 12px; border-radius: 8px; caret-color: #e6edf3; line-height: 1.5; white-space: pre; overflow: auto; margin-bottom: 0px;
`;
const AnalyzeBtn = styled.button`
  background: ${p => p.theme.accent}; color: #061019; font-weight:700; border:none; border-radius:7px; padding: 11px 21px; cursor:pointer;
`;
const SimpleBtn = styled.button`
  background: rgba(255,255,255,0.03); color: #e6edf3; border: 1px solid rgba(255,255,255,0.08); font-weight:700; padding: 10px 16px; border-radius:7px; cursor:pointer; margin:0; outline:none;
`;
const ClearBtn = styled(SimpleBtn)`
  color:#e06d6d; border: 1.5px solid #c26738; background:rgba(255,122,89,0.08);
`;
const FindingsPanel = styled.div`
  margin-top: 22px;
  h3 { font-size: 1.1em; margin: 0 0 0.7em 0; color: #e6eef0; }
  ul { margin:0; padding-left:18px; }
`;
const ErrorMsg = styled.div`
  color: #ff7a59; background:rgba(255,122,89,0.10); border-radius:7px; padding: 9px 10px; margin-bottom:7px; font-size: 13px;
`;
const InfoMsg = styled.div`
  color: #b8b8b6; font-size: 13px; margin-bottom: 8px;
`;
const Finding = styled.li`
  color: ${({ severity, theme }) => severity === "HIGH" || severity === "high" ? p => p.theme.accentAlt : severity === "medium" ? '#f6c86a' : '#6fd2c6'};
  font-size: 13px; font-family:monospace; margin-bottom:6px;
`;
const LoaderOverlay = styled.div`
  position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:99; background:linear-gradient(180deg,rgba(24,26,31,0.98),rgba(31,34,40,0.98)); pointer-events:${p=>p.show?"all":"none"}; opacity:${p=>p.show?1:0}; transition: opacity 450ms ease, visibility 450ms ease;
`;
export default App;
