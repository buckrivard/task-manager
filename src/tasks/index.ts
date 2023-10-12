export type TaskID = string;

export interface Task {
  ID: TaskID;
  complete: boolean;
  name: string;
  description?: string;
}

class TaskNotExistError extends Error {}

export class TaskManager {
  private tasks: Map<TaskID, Task>;
  private dependencies: Map<TaskID, TaskID[]>;

  constructor() {
    this.tasks = new Map();
    this.dependencies = new Map();
  }

  addTask(task: Task) {
    this.tasks.set(task.ID, task);
  }

  addDoBefore(task: TaskID, taskToDoBefore: TaskID | TaskID[]) {
    const existingDependencies = this.getDependency(task);
    if (existingDependencies) {
      existingDependencies.push(...taskToDoBefore);
    } else {
      this.dependencies.set(task, [...taskToDoBefore]);
    }
  }

  getCanDoTask(taskID: TaskID): boolean {
    const deps = this.getDependency(taskID);
    if (!deps) return true;
    return deps.every((id) => {
      const dependentTask = this.getTaskByID(id);
      return dependentTask.complete;
    });
  }

  getEligibleDependentTasks(taskID: TaskID) {
    // const task = this.getTaskByID(taskID)
    // task is eligible if there are no cycles
    const deps = this.getDependency(taskID) ?? [];
    return this.getTasks().filter(({ ID }) => ID !== taskID);
  }

  setTaskCompletion(taskID: TaskID, isComplete: boolean) {
    const task = this.getTaskByID(taskID);
    this.tasks.set(taskID, {
      ...task,
      complete: isComplete,
    });
  }

  getTasks(filter?: "complete" | "incomplete"): Task[] {
    const tasks = Array.from(this.tasks.values());
    switch (filter) {
      case "complete":
        return tasks.filter(({ complete }) => complete);
      case "incomplete":
        return tasks.filter(({ complete }) => !complete);
      default:
        return tasks;
    }
  }

  getTask(taskID: TaskID): Task {
    return this.getTaskByID(taskID);
  }

  getDependentTasks(taskID: TaskID): Task[] {
    const deps = this.getDependency(taskID);
    return deps?.map((ID) => this.getTaskByID(ID)) ?? [];
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

let taskID = 0;

export const taskManager = new TaskManager();
(window as any).tm = taskManager;
export const makeTask = (taskConfig: Omit<Task, "ID">): Task => {
  return {
    ...taskConfig,
    ID: (taskID++).toString(),
  };
};

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
