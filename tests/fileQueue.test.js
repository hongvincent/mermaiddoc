const { FileQueue } = require('../public/js/logic/fileQueue');

describe('FileQueue Logic (Ralph Loop)', () => {
  let queue;

  beforeEach(() => {
    queue = new FileQueue();
  });

  test('should add a file to the queue', () => {
    queue.add('test.md', 'docs/test.md', '# Hello');
    expect(queue.getAll().length).toBe(1);
    expect(queue.get(0).name).toBe('test.md');
  });

  test('should prevent duplicate paths', () => {
    queue.add('test.md', 'docs/test.md', '# Content 1');
    queue.add('test.md', 'docs/test.md', '# Content 2');
    expect(queue.getAll().length).toBe(1);
    expect(queue.get(0).content).toBe('# Content 2'); // Updated
  });

  test('should select a file and update active index', () => {
    queue.add('f1.md', 'f1.md', 'c1');
    queue.add('f2.md', 'f2.md', 'c2');
    queue.select(1);
    expect(queue.getActiveIndex()).toBe(1);
  });

  test('should navigate prev/next correctly', () => {
    queue.add('f1.md', 'f1.md', 'c1');
    queue.add('f2.md', 'f2.md', 'c2');
    queue.add('f3.md', 'f3.md', 'c3');
    
    queue.select(1);
    expect(queue.prev()).toBe(0);
    expect(queue.next()).toBe(1); // 0 -> 1
    expect(queue.next()).toBe(2);
    expect(queue.next()).toBe(2); // clamped
  });

  test('should handle removal correctly', () => {
    queue.add('f1.md', 'f1.md', 'c1');
    queue.add('f2.md', 'f2.md', 'c2');
    queue.select(1);
    queue.remove(0);
    expect(queue.getAll().length).toBe(1);
    expect(queue.getActiveIndex()).toBe(0);
  });

  test('should clear queue', () => {
    queue.add('f1.md', 'f1.md', 'c1');
    queue.clear();
    expect(queue.getAll().length).toBe(0);
    expect(queue.getActiveIndex()).toBe(-1);
  });
});
