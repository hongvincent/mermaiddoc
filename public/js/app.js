/**
 * app.js — Main application entry point
 */
const MermaidDocApp = (() => {
  function init() {
    // Initialize modules
    MermaidDocUploader.init(handleFileLoaded);
    MermaidDocPrinter.init();
    initThemeToggle();

    // "New file" button (opens file picker)
    const btnNewFile = document.getElementById('btn-new-file');
    btnNewFile.addEventListener('click', () => {
      document.getElementById('file-input').click();
    });

    // Prev/Next navigation
    const btnPrev = document.getElementById('btn-prev-file');
    const btnNext = document.getElementById('btn-next-file');
    if (btnPrev) btnPrev.addEventListener('click', () => MermaidDocUploader.navigatePrev());
    if (btnNext) btnNext.addEventListener('click', () => MermaidDocUploader.navigateNext());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); MermaidDocUploader.navigatePrev(); }
      if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); MermaidDocUploader.navigateNext(); }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); MermaidDocPrinter.printIfReady(); }
    });
  }

  /**
   * Called when a file is selected from the queue
   */
  async function handleFileLoaded(filename, content) {
    const uploadZone = document.getElementById('upload-zone');
    const viewer = document.getElementById('viewer');
    const viewerContent = document.getElementById('viewer-content');
    const viewerFilename = document.getElementById('viewer-filename');

    // Switch view
    uploadZone.hidden = true;
    viewer.hidden = false;
    viewerFilename.textContent = filename;

    // Show loading skeleton
    viewerContent.innerHTML = `
      <div class="mermaid-loading">
        <div class="mermaid-loading__bar"></div>
        <div class="mermaid-loading__bar"></div>
        <div class="mermaid-loading__bar"></div>
      </div>`;

    // Scroll to top
    viewerContent.scrollTop = 0;
    window.scrollTo(0, 0);

    // Render markdown + mermaid
    try {
      await MermaidDocRenderer.render(content, viewerContent);
      MermaidDocPrinter.enable();
    } catch (err) {
      console.error('Render error:', err);
      showToast('Failed to render document', 'error');
    }
  }

  /**
   * Show upload zone, hide viewer
   */
  function showUploadZone() {
    const uploadZone = document.getElementById('upload-zone');
    const viewer = document.getElementById('viewer');
    uploadZone.hidden = false;
    viewer.hidden = true;
    MermaidDocPrinter.disable();
  }

  /**
   * Theme toggle (light/dark)
   */
  function initThemeToggle() {
    const btnTheme = document.getElementById('btn-theme');
    const stored = localStorage.getItem('mermaiddoc-theme');

    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    btnTheme.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('mermaiddoc-theme', next);

      // Re-render mermaid with new theme colors
      MermaidDocRenderer.reinitMermaid();
      const viewerContent = document.getElementById('viewer-content');
      const viewer = document.getElementById('viewer');
      if (!viewer.hidden) {
        MermaidDocRenderer.renderMermaidBlocks(viewerContent);
      }
    });
  }

  /**
   * Show a toast notification
   */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(24px)';
      toast.style.transition = '0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  return { init, showToast, showUploadZone };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => {
  MermaidDocApp.init();
});
