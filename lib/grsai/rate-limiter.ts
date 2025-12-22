/**
 * 🔥 请求速率限制器
 * 避免触发 API 速率限制（429 错误）
 */
class RateLimiter {
  private queue: Array<{
    fn: () => Promise<unknown>
    resolve: (value: unknown) => void
    reject: (error: unknown) => void
  }> = []
  private running = 0
  private maxConcurrent: number
  private minDelay: number // 最小请求间隔（毫秒）

  constructor(maxConcurrent = 3, minDelay = 1000) {
    this.maxConcurrent = maxConcurrent
    this.minDelay = minDelay
  }

  /**
   * 执行请求（自动排队和限流）
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject: reject as (error: unknown) => void,
      })
      this.processQueue()
    })
  }

  /**
   * 处理队列
   */
  private async processQueue() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()!
      this.running++
      
      // 执行任务
      task.fn()
        .then((result) => {
          task.resolve(result)
        })
        .catch((error) => {
          task.reject(error)
        })
        .finally(() => {
          this.running--
          // 延迟后处理下一个任务（避免请求过快）
          setTimeout(() => {
            this.processQueue()
          }, this.minDelay)
        })
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      running: this.running,
      maxConcurrent: this.maxConcurrent,
    }
  }
}

// 创建全局速率限制器实例
export const rateLimiter = new RateLimiter(3, 1000) // 最多 3 个并发，最小间隔 1 秒

