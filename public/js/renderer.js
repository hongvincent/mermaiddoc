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
        return `
          <div class="mermaid-wrapper" id="${id}-wrapper">
            <pre class="mermaid" id="${id}">${escapeHtml(code)}</pre>
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
        primaryColor: '#353535',
        primaryTextColor: '#E8E8E8',
        primaryBorderColor: '#5A5A5A',
        lineColor: '#7A7A7A',
        secondaryColor: '#2A2A2A',
        tertiaryColor: '#323232',
        mainBkg: '#353535',
        nodeBorder: '#5A5A5A',
        clusterBkg: '#2A2A2A',
        clusterBorder: '#444444',
        titleColor: '#E8E8E8',
        edgeLabelBackground: '#252525',
        noteBkgColor: '#353535',
        noteTextColor: '#E8E8E8',
        noteBorderColor: '#5A5A5A',
        actorBkg: '#353535',
        actorTextColor: '#E8E8E8',
        actorBorder: '#5A5A5A',
        actorLineColor: '#7A7A7A',
        signalColor: '#E8E8E8',
        signalTextColor: '#E8E8E8',
        labelBoxBkgColor: '#353535',
        labelBoxBorderColor: '#5A5A5A',
        labelTextColor: '#E8E8E8',
        loopTextColor: '#E8E8E8',
        activationBorderColor: '#7A7A7A',
        activationBkgColor: '#404040',
        sequenceNumberColor: '#E8E8E8',
        fontFamily: '"Inter", sans-serif',
      } : {
        primaryColor: '#FFFFFF',
        primaryTextColor: '#37352F',
        primaryBorderColor: '#D4D4D0',
        lineColor: '#B0AFA8',
        secondaryColor: '#F5F5F4',
        tertiaryColor: '#FAFAF9',
        mainBkg: '#FFFFFF',
        nodeBorder: '#D4D4D0',
        clusterBkg: '#FAFAF9',
        clusterBorder: '#E3E3E0',
        titleColor: '#37352F',
        edgeLabelBackground: '#FFFFFF',
        noteBkgColor: '#FEFCE8',
        noteTextColor: '#37352F',
        noteBorderColor: '#E3E3E0',
        actorBkg: '#FFFFFF',
        actorTextColor: '#37352F',
        actorBorder: '#D4D4D0',
        actorLineColor: '#B0AFA8',
        signalColor: '#37352F',
        signalTextColor: '#37352F',
        labelBoxBkgColor: '#FFFFFF',
        labelBoxBorderColor: '#D4D4D0',
        labelTextColor: '#37352F',
        loopTextColor: '#37352F',
        activationBorderColor: '#D4D4D0',
        activationBkgColor: '#F5F5F4',
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

    try {
      await window.mermaid.run({ nodes: blocks });
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
  function reinitMermaid() {
    mermaidReady = false;
    initMermaid();
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
