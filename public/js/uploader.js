/**
 * uploader.js — UI Handler for file/folder drag-and-drop.
 * Uses FileQueue for logic (Ralph Loop).
 */
const MermaidDocUploader = (() => {
  let onFileSelected = null;
  /** @type {FileQueue} */
  let queue = null;

  function init(callback) {
    onFileSelected = callback;
    queue = new FileQueue();

    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const btnBrowse = document.getElementById('btn-browse');

    btnBrowse.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
    zone.addEventListener('click', (e) => {
      if (e.target === zone || e.target.closest('.upload-zone__inner')) fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
        fileInput.value = '';
      }
    });

    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
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
          handleFiles(files);
          return;
        }
      }
      handleFiles(Array.from(e.dataTransfer.files));
    });

    document.getElementById('btn-add-more').addEventListener('click', () => fileInput.click());
    document.getElementById('btn-clear-queue').addEventListener('click', clearQueue);
  }

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
        let batch;
        do {
          batch = await new Promise((resolve) => reader.readEntries(resolve));
          for (const child of batch) await processEntry(child, parentPath + entry.name + '/');
        } while (batch.length > 0);
      }
    }
    for (const entry of entries) await processEntry(entry, '');
    results.sort((a, b) => (a._relativePath || a.name).localeCompare(b._relativePath || b.name));
    return results;
  }

  function handleFiles(files) {
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (validFiles.length === 0) return;

    let loaded = 0;
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const path = file._relativePath || file.name;
        queue.add(file.name, path, e.target.result);
        loaded++;
        if (loaded === validFiles.length) {
          if (queue.getActiveIndex() === -1) selectFile(0);
          renderSidebar();
        }
      };
      reader.readAsText(file);
    });
  }

  function selectFile(index) {
    const file = queue.select(index);
    if (file) {
      renderSidebar();
      if (onFileSelected) onFileSelected(file.path, file.content);
    }
  }

  function removeFromQueue(index) {
    const activeBefore = queue.getActiveIndex();
    queue.remove(index);
    if (queue.getAll().length === 0) {
      MermaidDocApp.showUploadZone();
      hideSidebar();
    } else {
      const newActive = queue.getActiveIndex();
      if (newActive !== activeBefore) {
        selectFile(newActive);
      } else {
        renderSidebar();
      }
    }
  }

  function clearQueue() {
    queue.clear();
    MermaidDocApp.showUploadZone();
    hideSidebar();
  }

  function navigatePrev() { selectFile(queue.prev()); }
  function navigateNext() { selectFile(queue.next()); }

  function renderSidebar() {
    const list = document.getElementById('queue-list');
    const counter = document.getElementById('queue-counter');
    const activeIdx = queue.getActiveIndex();
    const files = queue.getAll();

    counter.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;
    list.innerHTML = files.map((f, i) => `
      <li class="queue-item ${i === activeIdx ? 'queue-item--active' : ''}">
        <div class="queue-item__info" onclick="MermaidDocUploader.selectFile(${i})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="queue-item__name">${f.path}</span>
        </div>
        <button class="queue-item__remove" onclick="MermaidDocUploader.removeFromQueue(${i})">×</button>
      </li>`).join('');

    document.getElementById('file-sidebar').classList.add('sidebar--visible');
    document.getElementById('btn-prev-file').disabled = activeIdx <= 0;
    document.getElementById('btn-next-file').disabled = activeIdx >= files.length - 1;
  }

  function hideSidebar() { document.getElementById('file-sidebar').classList.remove('sidebar--visible'); }

  return { init, selectFile, removeFromQueue, navigatePrev, navigateNext };
})();
