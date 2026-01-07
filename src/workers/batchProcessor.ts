self.addEventListener('message', (e) => {
  const { id, payload } = e.data || {};

  // Simulate CPU-bound task or long-running processing
  const duration = 800 + Math.floor(Math.random() * 2200);
  const start = Date.now();

  // Simulate progress for the worker by sending periodic updates
  const interval = setInterval(() => {
    const elapsed = Date.now() - start;
    const progress = Math.min(100, Math.round((elapsed / duration) * 100));
    self.postMessage({ id, type: 'progress', progress });
  }, 200);

  setTimeout(() => {
    clearInterval(interval);
    // Done - send result
    self.postMessage({ id, type: 'done', result: { message: 'Processed', id } });
  }, duration);
});

export {};