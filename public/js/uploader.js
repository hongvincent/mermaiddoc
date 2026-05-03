/**
 * uploader.js — Drag-and-drop handler with folder support + file queue
 */
const MermaidDocUploader = (() => {
  let onFileSelected = null; // callback(filename, content)

  /** @type {{ name: string, path: string, content: string }[]} */
  let fileQueue = [];
  let activeIndex = -1;

  function init(callback) {
    onFileSelected = callback;

    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const btnBrowse = document.getElementById('btn-browse');

    // Click to browse
    btnBrowse.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
    zone.addEventListener('click', (e) => {
      if (e.target === zone || e.target.closest('.upload-zone__inner')) {
        fileInput.click();
      }
    });

    // File input change (supports multiple)
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
        fileInput.value = '';
      }
    });

    // Drag-and-drop (files + folders)
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drag-over');

      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const entries = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry && items[i].webkitGetAsEntry();
          if (entry) entries.push(entry);
        }

        if (entries.length > 0) {
          const files = await collectFilesFromEntries(entries);
          if (files.length > 0) {
            handleFiles(files);
          } else {
            MermaidDocApp.showToast('No .md files found in the dropped items.', 'error');
          }
          return;
        }
      }

      // Fallback: regular file drop
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(Array.from(files));
      }
    });

    // Prevent default drag behavior on body
    document.body.addEventListener('dragover', (e) => e.preventDefault());
    document.body.addEventListener('drop', (e) => e.preventDefault());

    // Sidebar "add more" button
    const btnAddMore = document.getElementById('btn-add-more');
    if (btnAddMore) {
      btnAddMore.addEventListener('click', () => fileInput.click());
    }

    // Clear queue button
    const btnClearQueue = document.getElementById('btn-clear-queue');
    if (btnClearQueue) {
      btnClearQueue.addEventListener('click', clearQueue);
    }
  }

  /**
   * Recursively collect .md files from DataTransferEntry items (folder support)
   */
  async function collectFilesFromEntries(entries) {
    const results = [];

    async function processEntry(entry, parentPath) {
      if (entry.isFile) {
        const file = await new Promise((resolve) => entry.file(resolve));
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (['.md', '.markdown', '.txt'].includes(ext)) {
          file._relativePath = parentPath + file.name;
          results.push(file);
        }
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        let allEntries = [];
        // readEntries may not return all entries at once, need to call repeatedly
        let batch;
        do {
          batch = await new Promise((resolve) => reader.readEntries(resolve));
          allEntries = allEntries.concat(Array.from(batch));
        } while (batch.length > 0);

        for (const child of allEntries) {
          await processEntry(child, parentPath + entry.name + '/');
        }
      }
    }

    for (const entry of entries) {
      await processEntry(entry, '');
    }

    // Sort by path for consistent ordering
    results.sort((a, b) => (a._relativePath || a.name).localeCompare(b._relativePath || b.name));
    return results;
  }

  /**
   * Handle an array of File objects — read them and add to queue
   */
  function handleFiles(files) {
    const validExts = ['.md', '.markdown', '.txt'];
    const validFiles = files.filter((f) => {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      return validExts.includes(ext) && f.size <= 10 * 1024 * 1024;
    });

    if (validFiles.length === 0) {
      MermaidDocApp.showToast('No valid .md files found.', 'error');
      return;
    }

    let loaded = 0;
    const total = validFiles.length;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const relativePath = file._relativePath || file.name;
        addToQueue(file.name, relativePath, e.target.result);
        loaded++;
        if (loaded === total) {
          MermaidDocApp.showToast(`${total} file${total > 1 ? 's' : ''} loaded`, 'success');
          // Auto-select first file if none is active
          if (activeIndex === -1 && fileQueue.length > 0) {
            selectFile(0);
          }
        }
      };
      reader.onerror = () => {
        loaded++;
        MermaidDocApp.showToast(`Failed to read: ${file.name}`, 'error');
      };
      reader.readAsText(file);
    });
  }

  /**
   * Add a file to the queue
   */
  function addToQueue(name, path, content) {
    // Avoid duplicate paths
    const existing = fileQueue.findIndex((f) => f.path === path);
    if (existing !== -1) {
      fileQueue[existing].content = content; // Update content
      renderSidebar();
      return;
    }

    fileQueue.push({ name, path, content });
    renderSidebar();
    showSidebar();
  }

  /**
   * Select a file from the queue to view
   */
  function selectFile(index) {
    if (index < 0 || index >= fileQueue.length) return;
    activeIndex = index;
    renderSidebar();
    const file = fileQueue[index];
    if (onFileSelected) {
      onFileSelected(file.path, file.content);
    }
  }

  /**
   * Remove a file from the queue
   */
  function removeFromQueue(index) {
    if (index < 0 || index >= fileQueue.length) return;
    fileQueue.splice(index, 1);

    if (fileQueue.length === 0) {
      activeIndex = -1;
      hideSidebar();
      MermaidDocApp.showUploadZone();
    } else if (activeIndex >= fileQueue.length) {
      selectFile(fileQueue.length - 1);
    } else if (activeIndex === index) {
      selectFile(Math.min(index, fileQueue.length - 1));
    } else if (activeIndex > index) {
      activeIndex--;
      renderSidebar();
    } else {
      renderSidebar();
    }
  }

  /**
   * Clear all files from the queue
   */
  function clearQueue() {
    fileQueue = [];
    activeIndex = -1;
    hideSidebar();
    MermaidDocApp.showUploadZone();
  }

  /**
   * Navigate to previous/next file
   */
  function navigatePrev() {
    if (activeIndex > 0) selectFile(activeIndex - 1);
  }

  function navigateNext() {
    if (activeIndex < fileQueue.length - 1) selectFile(activeIndex + 1);
  }

  /**
   * Render the sidebar file list
   */
  function renderSidebar() {
    const list = document.getElementById('queue-list');
    const counter = document.getElementById('queue-counter');
    if (!list) return;

    counter.textContent = `${fileQueue.length} file${fileQueue.length !== 1 ? 's' : ''}`;

    list.innerHTML = fileQueue
      .map(
        (file, i) => `
        <li class="queue-item ${i === activeIndex ? 'queue-item--active' : ''}" data-index="${i}">
          <div class="queue-item__info" data-action="select" data-index="${i}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span class="queue-item__name" title="${file.path}">${file.path}</span>
          </div>
          <button class="queue-item__remove" data-action="remove" data-index="${i}" title="Remove">×</button>
        </li>`
      )
      .join('');

    // Attach event listeners
    list.querySelectorAll('[data-action="select"]').forEach((el) => {
      el.addEventListener('click', () => selectFile(parseInt(el.dataset.index)));
    });

    list.querySelectorAll('[data-action="remove"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromQueue(parseInt(el.dataset.index));
      });
    });

    // Update nav buttons
    const btnPrev = document.getElementById('btn-prev-file');
    const btnNext = document.getElementById('btn-next-file');
    if (btnPrev) btnPrev.disabled = activeIndex <= 0;
    if (btnNext) btnNext.disabled = activeIndex >= fileQueue.length - 1;
  }

  function showSidebar() {
    const sidebar = document.getElementById('file-sidebar');
    if (sidebar) sidebar.classList.add('sidebar--visible');
  }

  function hideSidebar() {
    const sidebar = document.getElementById('file-sidebar');
    if (sidebar) sidebar.classList.remove('sidebar--visible');
  }

  /** Public getters */
  function getQueueLength() { return fileQueue.length; }
  function getActiveIndex() { return activeIndex; }

  return {
    init, navigatePrev, navigateNext,
    getQueueLength, getActiveIndex,
    selectFile, clearQueue,
  };
})();
