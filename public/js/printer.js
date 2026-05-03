/**
 * printer.js — Print functionality
 */
const MermaidDocPrinter = (() => {
  function init() {
    const btnPrint = document.getElementById('btn-print');
    btnPrint.addEventListener('click', () => {
      printDocument();
    });
  }

  function printDocument() {
    // Ensure all mermaid SVGs are fully rendered before printing
    const svgs = document.querySelectorAll('.mermaid-wrapper svg');
    if (svgs.length === 0 && document.querySelectorAll('pre.mermaid').length > 0) {
      MermaidDocApp.showToast('Waiting for diagrams to render…', 'info');
      setTimeout(() => printDocument(), 500);
      return;
    }

    window.print();
  }

  function printIfReady() {
    const btn = document.getElementById('btn-print');
    if (!btn.disabled) printDocument();
  }

  function enable() {
    document.getElementById('btn-print').disabled = false;
  }

  function disable() {
    document.getElementById('btn-print').disabled = true;
  }

  return { init, enable, disable, printIfReady };
})();
