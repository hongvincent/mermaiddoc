/**
 * renderer.js — Markdown parsing + Mermaid rendering pipeline
 */
const MermaidDocRenderer = (() => {
  let md = null;
  let mermaidReady = false;
  let renderCounter = 0;

  /**
   * Initialize markdown-it with custom fence renderer for mermaid blocks
   */
  function initMarkdownIt() {
    md = window.markdownit({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => {
        if (lang === 'mermaid') return ''; // handled separately
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value;
          } catch (_) { /* fall through */ }
        }
        return ''; // use external default escaping
      },
    });

    // Override fence renderer to intercept mermaid blocks
    const defaultFence = md.renderer.rules.fence ||
      function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
      };

    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const info = token.info ? token.info.trim().toLowerCase() : '';

      if (info === 'mermaid') {
        const code = token.content.trim();
        const id = `mermaid-block-${++renderCounter}`;
        // Wrap in our container; actual rendering happens after DOM insertion
        // Store code in data-code for re-rendering during theme changes
        return `
          <div class="mermaid-wrapper" id="${id}-wrapper">
            <pre class="mermaid" id="${id}" data-code="${escapeHtml(code)}">${escapeHtml(code)}</pre>
            <button class="mermaid-download" data-target="${id}" title="Download SVG">⬇ SVG</button>
          </div>`;
      }

      return defaultFence(tokens, idx, options, env, self);
    };
  }

  /**
   * Initialize Mermaid with Notion-like formal settings
   */
  function initMermaid() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 14,
      flowchart: {
        curve: 'stepAfter',
        nodeSpacing: 50,
        rankSpacing: 60,
        padding: 15,
        htmlLabels: true,
        useMaxWidth: true,
      },
      sequence: {
        useMaxWidth: true,
        actorMargin: 80,
        mirrorActors: false,
        messageMargin: 40,
      },
      themeVariables: isDark ? {
        primaryColor: '#2F2F2F',
        primaryTextColor: '#E3E3E0',
        primaryBorderColor: '#444444',
        lineColor: '#888888',
        secondaryColor: '#252525',
        tertiaryColor: '#2F2F2F',
        mainBkg: '#2F2F2F',
        nodeBorder: '#444444',
        clusterBkg: '#1F1F1F',
        clusterBorder: '#37352F',
        titleColor: '#E3E3E0',
        edgeLabelBackground: '#191919',
        noteBkgColor: '#2F2F2F',
        noteTextColor: '#E3E3E0',
        noteBorderColor: '#444444',
        actorBkg: '#2F2F2F',
        actorTextColor: '#E3E3E0',
        actorBorder: '#444444',
        actorLineColor: '#888888',
        signalColor: '#E3E3E0',
        signalTextColor: '#E3E3E0',
        labelBoxBkgColor: '#2F2F2F',
        labelBoxBorderColor: '#444444',
        labelTextColor: '#E3E3E0',
        loopTextColor: '#E3E3E0',
        activationBorderColor: '#888888',
        activationBkgColor: '#3F3F3F',
        sequenceNumberColor: '#E3E3E0',
        fontFamily: '"Inter", sans-serif',
      } : {
        primaryColor: '#F7F7F5',
        primaryTextColor: '#37352F',
        primaryBorderColor: '#E3E3E0',
        lineColor: '#999999',
        secondaryColor: '#FBFBFA',
        tertiaryColor: '#FFFFFF',
        mainBkg: '#F7F7F5',
        nodeBorder: '#E3E3E0',
        clusterBkg: '#FBFBFA',
        clusterBorder: '#E3E3E0',
        titleColor: '#37352F',
        edgeLabelBackground: '#FFFFFF',
        noteBkgColor: '#FEFCE8',
        noteTextColor: '#37352F',
        noteBorderColor: '#E3E3E0',
        actorBkg: '#F7F7F5',
        actorTextColor: '#37352F',
        actorBorder: '#E3E3E0',
        actorLineColor: '#999999',
        signalColor: '#37352F',
        signalTextColor: '#37352F',
        labelBoxBkgColor: '#F7F7F5',
        labelBoxBorderColor: '#E3E3E0',
        labelTextColor: '#37352F',
        loopTextColor: '#37352F',
        activationBorderColor: '#E3E3E0',
        activationBkgColor: '#F1F1EF',
        sequenceNumberColor: '#37352F',
        fontFamily: '"Inter", sans-serif',
      },
    });

    mermaidReady = true;
  }

  /**
   * Parse markdown text to HTML
   */
  function parseMarkdown(text) {
    if (!md) initMarkdownIt();
    return md.render(text);
  }

  /**
   * Render all mermaid blocks in a container element
   */
  async function renderMermaidBlocks(container) {
    if (!mermaidReady) initMermaid();

    const blocks = container.querySelectorAll('pre.mermaid');
    if (blocks.length === 0) return;

    // Reset blocks for re-rendering if they were already processed
    blocks.forEach(block => {
      if (block.getAttribute('data-processed')) {
        block.removeAttribute('data-processed');
        const originalCode = block.getAttribute('data-code');
        if (originalCode) {
          block.textContent = originalCode;
          block.innerHTML = escapeHtml(originalCode);
        }
      }
    });

    try {
      await window.mermaid.run({ 
        nodes: blocks,
        suppressErrors: true
      });
    } catch (err) {
      console.error('Mermaid render error:', err);
      // Mark failed blocks with error state
      blocks.forEach((block) => {
        if (!block.querySelector('svg')) {
          const wrapper = block.closest('.mermaid-wrapper');
          if (wrapper) {
            wrapper.classList.add('mermaid-error-state');
            const errDiv = document.createElement('div');
            errDiv.className = 'mermaid-error';
            errDiv.textContent = err.message || 'Failed to render diagram';
            wrapper.appendChild(errDiv);
          }
        }
      });
    }

    // Attach SVG download handlers
    container.querySelectorAll('.mermaid-download').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        const wrapper = document.getElementById(`${targetId}-wrapper`);
        const svg = wrapper?.querySelector('svg');
        if (!svg) return;
        downloadSvg(svg, targetId);
      });
    });
  }

  /**
   * Full render pipeline: markdown → HTML → DOM → mermaid
   */
  async function render(markdownText, container) {
    const html = parseMarkdown(markdownText);
    container.innerHTML = html;
    await renderMermaidBlocks(container);
  }

  /**
   * Re-initialize mermaid (e.g., after theme change)
   */
  async function reinitMermaid(container) {
    mermaidReady = false;
    initMermaid();
    if (container) {
      await renderMermaidBlocks(container);
    }
  }

  /* ---- Helpers ---- */

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function downloadSvg(svgEl, name) {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { render, reinitMermaid, parseMarkdown, renderMermaidBlocks };
})();
