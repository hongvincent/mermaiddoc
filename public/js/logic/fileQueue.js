/**
 * fileQueue.js — Pure logic for managing the file queue (Ralph Loop)
 */
class FileQueue {
  constructor() {
    this.files = [];
    this.activeIndex = -1;
  }

  add(name, path, content) {
    const existing = this.files.findIndex((f) => f.path === path);
    if (existing !== -1) {
      this.files[existing].content = content;
      return existing;
    }
    this.files.push({ name, path, content });
    return this.files.length - 1;
  }

  get(index) {
    return this.files[index] || null;
  }

  getAll() {
    return this.files;
  }

  getActiveIndex() {
    return this.activeIndex;
  }

  select(index) {
    if (index >= 0 && index < this.files.length) {
      this.activeIndex = index;
      return this.files[index];
    }
    return null;
  }

  remove(index) {
    if (index < 0 || index >= this.files.length) return false;
    this.files.splice(index, 1);
    
    if (this.files.length === 0) {
      this.activeIndex = -1;
    } else if (this.activeIndex >= this.files.length) {
      this.activeIndex = this.files.length - 1;
    } else if (this.activeIndex === index) {
      this.activeIndex = Math.min(index, this.files.length - 1);
    } else if (this.activeIndex > index) {
      this.activeIndex--;
    }
    return true;
  }

  clear() {
    this.files = [];
    this.activeIndex = -1;
  }

  next() {
    if (this.activeIndex < this.files.length - 1) {
      this.activeIndex++;
    }
    return this.activeIndex;
  }

  prev() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
    return this.activeIndex;
  }
}

// Universal module definition
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FileQueue };
} else {
  window.FileQueue = FileQueue;
}
