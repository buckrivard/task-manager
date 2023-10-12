type TaskID = string;

export interface Task {
  ID: TaskID;
  complete: boolean;
  name: string;
  description?: string;
}

class TaskNotExistError extends Error {}

class TaskManager {
  private tasks: Map<TaskID, Task>;
  private dependencies: Map<TaskID, TaskID[]>;

  constructor() {
    this.tasks = new Map();
    this.dependencies = new Map();
  }

  addTask(task: Task) {
    this.tasks.set(task.ID, task);
  }

  addDoBefore(task: TaskID, taskToDoBefore: TaskID) {
    const existingDependencies = this.getDependency(task);
    if (existingDependencies) {
      existingDependencies.push(taskToDoBefore);
    } else {
      this.dependencies.set(task, [taskToDoBefore]);
    }
  }

  canDoTask(task: Task) {
    return this.dependencies.get(task.ID)?.every((id) => {
      const dependentTask = this.getTaskByID(id);
      return dependentTask.complete;
    });
  }

  private getTaskByID(taskID: TaskID): Task {
    const task = this.tasks.get(taskID);

    if (!task) throw new TaskNotExistError();

    return task;
  }

  private getDependency(taskID: TaskID) {
    return this.dependencies.get(taskID);
  }
}

export const taskManager = new TaskManager();

/**
 * EXAMPLE:
 *
 * ~~~ VERBOSE ~~~
 * wipeCounters {
 *  completeFirst: [finishedCooking],
 * }
 * finishedCooking {
 *  completeFirst: []
 * }
 * vacuum {
 *  completeFirst: [wipeCounters]
 * }
 * checkout {
 *  completeFirst: [vacuum]
 * }
 * tasks {
 *  wipeCounters: Task
 *  finishedCooking: Task
 *  vacuum: Task
 *  checkout: Task
 * }
 *
 * deps {
 *  finishedCooking: []
 *  wipeCounters: [finishedCooking]
 *  vacuum: [wipeCounters],
 *  checkout: [vacuum]
 * }
 * // should deps include upstream deps?
 *
 */
