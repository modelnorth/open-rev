/**
 * OpenRev Async Worker Pool
 * 
 * Manages background task execution queues per tool for non-blocking UI operations.
 */

export interface Job {
  id: string;
  name: string;
  toolId: string;
  payload: any;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number; // 0 to 100
  result?: any;
  error?: string;
}

export class WorkerPool {
  private queue: Job[] = [];
  private activeJobs: Map<string, Job> = new Map();

  public addJob(name: string, toolId: string, payload: any): Job {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      toolId,
      payload,
      status: 'queued',
      progress: 0
    };
    this.queue.push(job);
    this.processQueue();
    return job;
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const job = this.queue.shift();
    if (!job) return;

    job.status = 'running';
    this.activeJobs.set(job.id, job);

    console.log(`[WorkerPool] Starting worker job ${job.id}: ${job.name} (Tool: ${job.toolId})`);

    // Simulate async execution step
    setTimeout(() => {
      job.status = 'completed';
      job.progress = 100;
      job.result = { message: `Completed ${job.name} successfully.` };
      console.log(`[WorkerPool] Completed job ${job.id}`);
    }, 500);
  }

  public getJob(id: string): Job | undefined {
    return this.activeJobs.get(id) || this.queue.find((j) => j.id === id);
  }

  public listJobs(): Job[] {
    return [...Array.from(this.activeJobs.values()), ...this.queue];
  }
}
