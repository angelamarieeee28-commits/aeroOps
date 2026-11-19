export const GROUND_OPERATIONS = {
  marshall: "marshall",
  chocks: "chocks",
  inspection: "inspection",
  fireguard: "fireguard"
};

const operationIds = Object.values(GROUND_OPERATIONS);
export const groundOperationCount = operationIds.length;
export const TASKS_KEY = "aeroops-ground-tasks";

export function readGroundTasks() {
  try {
    const tasks = JSON.parse(localStorage.getItem(TASKS_KEY));
    return tasks && typeof tasks === "object" && !Array.isArray(tasks)
      ? tasks
      : {};
  } catch {
    return {};
  }
}

export function getFlightProgress(flight, tasks) {
  const completedOperations = operationIds.filter(
    id => tasks?.[`${flight.id}::${id}`]?.completed
  ).length;

  const status = completedOperations === groundOperationCount &&
    flight.status !== "Cancelled"
    ? "Completed"
    : flight.status;

  return { completedOperations, status };
}
