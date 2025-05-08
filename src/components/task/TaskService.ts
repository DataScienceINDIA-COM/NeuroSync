import type { Task } from '@/types/task';
import type { User } from '@/types/user'; // Ensure User type is correctly imported
import { getDayOfYear } from 'date-fns';
import { generateId } from '@/lib/utils'; // Assuming generateId is moved to utils or use crypto.randomUUID

/**
 * @class TaskService
 * @exports TaskService
 * @classdesc Manages the creation, updating, deletion, and retrieval of tasks.
 */
class TaskService {
  // In a real app, this would interact with a persistent store (e.g., localStorage, API)
  private db: { tasks: Task[] }; 
  private user: User; // Store user to manage streak related to this user
  private lastCompletedDay: number | null = null; // Store last completion day for streak

  /**
   * @constructor
   * @description Initializes the TaskService.
   * @param {User} user - The user for whom tasks are being managed.
   * @returns {void}
   */
  constructor(user: User) {
    this.db = { tasks: [] }; // Initialize with empty tasks or load from storage
    this.user = user;
    // Potentially load lastCompletedDay from storage for this user
  }

  /**
   * @method createTask
   * @description Creates a new task.
   * @param {Omit<Task, 'id' | 'isCompleted'>} taskData - The task data, including name, description, rewardPoints, and hasNeuroBoost.
   * @returns {Task} - The newly created task.
   */
  createTask(
    taskData: Omit<Task, 'id' | 'isCompleted'>
  ): Task {
    const newTask: Task = {
      id: generateId(), // Use a robust ID generation method
      isCompleted: false,
      ...taskData, // Spread all properties from taskData, including hasNeuroBoost
    };
    
    // No need to multiply rewardPoints here if hasNeuroBoost logic is handled at point calculation
    this.db.tasks.push(newTask);
    return newTask;
  }

  /**
   * @method updateTask
   * @description Updates an existing task.
   * @param {string} taskId - The ID of the task to be updated.
   * @param {Partial<Omit<Task, 'id'>>} updatedData - The updated task data.
   * @returns {Task | null} - The updated task or null if the task was not found.
   */
  updateTask(
    taskId: string,
    updatedData: Partial<Omit<Task, 'id'>>
  ): Task | null {
    const taskIndex = this.db.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      return null;
    }
    
    const originalTask = this.db.tasks[taskIndex];
    this.db.tasks[taskIndex] = { ...originalTask, ...updatedData };

    // If task is marked completed, update streak
    if (updatedData.isCompleted && !originalTask.isCompleted) {
        this.updateStreak();
    }

    return this.db.tasks[taskIndex];
  }

  /**
   * @method deleteTask
   * @description Deletes an existing task.
   * @param {string} taskId - The ID of the task to be deleted.
   * @returns {boolean} - True if the task was deleted, false otherwise.
   */
  deleteTask(taskId: string): boolean {
    const initialLength = this.db.tasks.length;
    this.db.tasks = this.db.tasks.filter((task) => task.id !== taskId);
    return this.db.tasks.length < initialLength;
  }

  /**
   * @method getTasks
   * @description Gets all existing tasks for the current user context.
   * @returns {Task[]} - An array of all tasks.
   */
  getTasks(): Task[] {
    return [...this.db.tasks]; // Return a copy to prevent direct modification
  }

  /**
   * @method getTask
   * @description Gets a task by its ID.
   * @param {string} taskId - The ID of the task to be retrieved.
   * @returns {Task | null} - The task or null if the task was not found.
   */
  getTask(taskId: string): Task | null {
    const task = this.db.tasks.find((task) => task.id === taskId);
    return task ? { ...task } : null; // Return a copy
  }
  
  /**
   * @method updateStreak
   * @description Updates the user's streak based on task completion.
   * @private
   */
  private updateStreak() {
      const today = getDayOfYear(new Date());
      // This logic assumes lastCompletedDay is for the specific user,
      // managed perhaps in a user service or persisted with user data.
      // For this simple TaskService, it's reset per instance or needs loading.
      if (this.lastCompletedDay === null || this.lastCompletedDay < today - 1) {
          this.user.streak = 1; // Start new streak or reset after a gap
      } else if (this.lastCompletedDay === today - 1) {
          this.user.streak += 1; // Continue streak
      } else if (this.lastCompletedDay === today) {
          // Already completed a task today, streak doesn't increase further for *another* task same day
          // but doesn't break.
      }
      this.lastCompletedDay = today;
      // Note: this.user.streak modification here updates the user object passed to constructor.
      // In a real app, you'd likely call a UserService to update the user's streak persistently.
  }

  /**
   * @method resetStreak
   * @description Resets the user's streak. Typically called if a day is missed.
   */
  public resetStreak() {
      this.user.streak = 0;
      this.lastCompletedDay = null; 
      // Persist this change for the user.
  }
}

export default TaskService;
