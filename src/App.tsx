import { useState } from "react";
import "./App.css";
import {
  makeTask,
  taskManager as tm,
  TaskID,
  TaskManager,
} from "./tasks/index.js";

function useForceRerender() {
  const [_, setState] = useState(0);
  return () => setState((old) => old + 1);
}

function withIntercept<T extends object>(
  originalObj: T,
  fn: (property: keyof T, argumentsList: unknown[]) => void,
): T {
  const handler: ProxyHandler<T> = {
    get: (target, property) => {
      if (typeof target[property as keyof T] === "function") {
        return new Proxy(target[property as keyof T] as any, {
          apply: (target, thisArg, argumentsList) => {
            fn(property as keyof T, argumentsList);
            return Reflect.apply(target, thisArg, argumentsList);
          },
        });
      } else {
        return Reflect.get(target, property);
      }
    },
  };

  return new Proxy(originalObj, handler);
}

function useBindAPIToReact<T extends object>(
  originalObj: T,
  shouldTriggerRerender: (methodName: keyof T) => boolean,
): T {
  const updateState = useForceRerender();
  const [api] = useState(
    withIntercept(originalObj, (methodName) => {
      if (shouldTriggerRerender(methodName)) {
        updateState();
      }
    }),
  );

  return api;
}

function App() {
  const taskManager = useBindAPIToReact(
    tm,
    (method) => !method.startsWith("get"),
  );

  const [activeTask, setActiveTask] = useState<TaskID | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const addTask = () => {
    const task = makeTask({
      complete: false,
      name,
      description: desc,
    });
    taskManager.addTask(task);
    setName("");
    setDesc("");
  };

  return activeTask ? (
    <TaskView
      taskManager={taskManager}
      taskID={activeTask}
      goBack={() => setActiveTask(null)}
    />
  ) : (
    <div>
      <h1>Tasks</h1>
      <h3>Create new</h3>
      <TaskForm
        name={name}
        setName={setName}
        desc={desc}
        setDesc={setDesc}
        onCreateTask={addTask}
      />
      <ul>
        {taskManager.getTasks().map((task) => (
          <li key={task.ID}>
            <a onClick={() => setActiveTask(task.ID)}>{task.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TaskForm = ({
  desc,
  name,
  onCreateTask,
  setDesc,
  setName,
}: {
  name: string;
  setName: (n: string) => void;
  desc: string;
  setDesc: (s: string) => void;
  onCreateTask: VoidFunction;
}) => (
  <div>
    <div>
      <label htmlFor="name">Name</label>
      <input
        id="name"
        type="text"
        value={name}
        onChange={({ target: { value } }) => setName(value)}
      />
    </div>
    <div>
      <label htmlFor="desc">Description</label>
      <textarea
        id="desc"
        value={desc}
        onChange={({ target: { value } }) => setDesc(value)}
      />
    </div>
    <button onClick={onCreateTask}>Add</button>
  </div>
);

const TaskView = ({
  taskID,
  goBack,
  taskManager,
}: {
  taskManager: TaskManager;
  taskID: TaskID;
  goBack: () => void;
}) => {
  // const [activeAction, setActiveAction] = useState<Action | null>(null);
  const task = taskManager.getTask(taskID);

  return (
    <div>
      <h1>
        <a onClick={goBack}>{task.name}</a>
      </h1>
      <p>{task.description}</p>
      <label>
        Complete?
        <input
          type="checkbox"
          disabled={!taskManager.getCanDoTask(taskID)}
          checked={task.complete}
          onChange={({ target: { checked } }) =>
            taskManager.setTaskCompletion(taskID, checked)
          }
        />
      </label>
      <h2>Depends On?</h2>
      <ul>
        {taskManager.getEligibleDependentTasks(taskID).map(({ name, ID }) => {
          return (
            <li key={ID}>
              <label>
                <input
                  type="checkbox"
                  checked={taskManager.getBlockingTaskIDs(taskID).includes(ID)}
                  onChange={({ target: { checked } }) => {
                    if (checked) {
                      taskManager.addBlockingTask(taskID, ID);
                    } else {
                      taskManager.removeBlockingTask(taskID, ID);
                    }
                  }}
                />
                {name}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default App;
