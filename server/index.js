const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const { parseSource } = require('../parser');
const { analyzeFunction, analyzeForIssues } = require('../analyzer');
const pyAdapter = require('../languages/python/adapter');
const { Worker } = require('worker_threads');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

app.post('/analyze', async (req, res) => {
  // Accept either `language` or `lang` from the client for flexibility
  const { code = '', language = '', lang = '' } = req.body;
  const langNormalized = (language || lang || 'JavaScript');

  // Run analysis in a worker thread with a timeout guard to prevent long/hanging runs
  const workerPath = path.resolve(__dirname, './analyzeWorker.js');
  const timeoutMs = 2000; // 2s timeout for analysis

  try {
    const result = await new Promise((resolve) => {
      const worker = new Worker(workerPath);
      let finished = false;
      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          try { worker.terminate(); } catch (e) {}
          resolve({ findings: [], error: 'Analyzer timed out', details: `Analysis exceeded ${timeoutMs}ms`, meta: { durationMs: timeoutMs } });
        }
      }, timeoutMs);

      worker.on('message', (msg) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(msg);
        try { worker.terminate(); } catch (e) {}
      });

      worker.on('error', (err) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve({ findings: [], error: 'Analyzer worker error', details: err && err.message ? String(err.message) : 'Worker error', meta: { durationMs: 0 } });
        try { worker.terminate(); } catch (e) {}
      });

      // send payload
      worker.postMessage({ code, lang: langNormalized });
    });

    // Normalize result to always include findings and meta
    const findings = Array.isArray(result.findings) ? result.findings : [];
    const meta = result.meta || { durationMs: null };
    if (result.error) return res.status(500).json({ findings, error: result.error, details: result.details || '', meta });
    return res.json({ findings, meta });
  } catch (err) {
    console.error('analyze error', err && err.stack || err);
    return res.status(500).json({ findings: [], error: 'Analyzer failed', details: err && err.message ? String(err.message) : 'Unknown error', meta: { durationMs: null } });
  }
});

// Health check for frontend to verify backend is reachable
app.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Faultline API running on http://localhost:${port}`));
