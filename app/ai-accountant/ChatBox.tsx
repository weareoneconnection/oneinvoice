'use client';
import { useState } from 'react';

export default function ChatBox() {
  const [question, setQuestion] = useState('这个月 consolidated e-Invoice 还差什么？');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask() {
    setAnswer('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAnswer((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-black">Ask AI Accountant</h2>
      <textarea
        className="input mt-4 min-h-28"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={loading}
      />
      <button className="btn mt-3" onClick={ask} disabled={loading}>
        {loading ? 'Thinking…' : 'Ask'}
      </button>
      {answer && (
        <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          {answer}
          {loading && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-slate-400" />}
        </div>
      )}
    </div>
  );
}

