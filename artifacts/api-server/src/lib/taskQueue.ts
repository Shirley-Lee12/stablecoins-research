type Task = () => Promise<void>;

export class FixedConcurrencyQueue {
  private active = 0;
  private readonly pending: Task[] = [];

  constructor(private readonly concurrency: number) {}

  enqueue(task: Task): void {
    this.pending.push(task);
    this.drain();
  }

  private drain(): void {
    while (this.active < this.concurrency && this.pending.length > 0) {
      const task = this.pending.shift()!;
      this.active += 1;
      void task()
        .catch(() => undefined)
        .finally(() => {
          this.active -= 1;
          this.drain();
        });
    }
  }
}

/** One process-wide worker pool keeps parsing and LLM spend bounded. */
export const uploadTaskQueue = new FixedConcurrencyQueue(2);
export const aiReviewTaskQueue = new FixedConcurrencyQueue(2);
export const backgroundTaskQueue = new FixedConcurrencyQueue(1);
