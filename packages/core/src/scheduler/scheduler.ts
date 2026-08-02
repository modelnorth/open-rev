/**
 * OpenRev Task Scheduler & Priority Queue
 * 
 * Schedules analysis tasks with priorities, concurrency limits, retries, and cancellation tokens.
 */

export interface TaskSpec {
  id: string;
  name: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  maxRetries: number;
  retryCount: number;
  run: () => Promise<any>;
}

export class TaskScheduler {
  private queue: TaskSpec[] = [];
  private concurrencyLimit: number = 4;
  private runningCount: number = 0;

  constructor(concurrencyLimit: number = 4) {
    this.concurrencyLimit = concurrencyLimit;
  }

  public schedule(name: string, priority: TaskSpec['priority'], runFn: () => Promise<any>): TaskSpec {
    const task: TaskSpec = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      priority,
      maxRetries: 3,
      retryCount: 0,
      run: runFn
    };

    this.queue.push(task);
    this.sortQueue();
    this.tick();
    return task;
  }

  private sortQueue(): void {
    const priorityWeight = { critical: 4, high: 3, normal: 2, low: 1 };
    this.queue.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  private async tick(): Promise<void> {
    if (this.runningCount >= this.concurrencyLimit || this.queue.length === 0) return;

    const task = this.queue.shift();
    if (!task) return;

    this.runningCount++;
    console.error(`[TaskScheduler] Running priority task [${task.priority}] ${task.name} (${task.id})`);

    try {
      await task.run();
      console.error(`[TaskScheduler] Task ${task.id} completed.`);
    } catch (err) {
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        console.warn(`[TaskScheduler] Retrying task ${task.id} (Attempt ${task.retryCount})`);
        this.queue.push(task);
      } else {
        console.error(`[TaskScheduler] Task ${task.id} failed permanently.`);
      }
    } finally {
      this.runningCount--;
      this.tick();
    }
  }
}
