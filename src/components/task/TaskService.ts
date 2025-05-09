import type { Task } from '@/types/task';
import type { User } from '@/types/user';
import { getDayOfYear } from 'date-fns';
import { generateId } from '@/lib/utils';
import { getTaskSuggestions, type TaskSuggestionsInput, type SuggestedTask, type TaskSuggestionsOutput } from '@/ai/flows/task-suggestions'; 
import { calculateRewardPoints, type CalculateRewardPointsInput } from '@/ai/tools/calculate-reward-points';
import type { MoodLog } from '@/types/mood'; 

/**
 * @class TaskService
 * @exports TaskService
 * @classdesc Manages the creation, updating, deletion, and retrieval of tasks.
 */
class TaskService {
  private db: { tasks: Task[] }; 
  public user: User; 
  private lastCompletedDay: number | null = null; 

  constructor(user: User) {
    this.db = { tasks: [] }; 
    this.user = user;
  }

  async createTask(
    taskData: Omit<Task, 'id' | 'isCompleted' | 'rewardPoints'> & { rewardPoints?: number }
  ): Promise<Task> {
    
    let rewardPoints = taskData.rewardPoints;
    if (rewardPoints === undefined) {
        // If rewardPoints are not provided (e.g., for AI suggested tasks), calculate them.
        const currentUserMood = this.user.moodLogs?.[0]?.mood || "Neutral";
        const rewardPointsInput: CalculateRewardPointsInput = {
          taskDescription: taskData.description,
          userMood: currentUserMood, 
          hormoneLevels: this.user.hormoneLevels,
        };
        rewardPoints = await calculateRewardPoints(rewardPointsInput);
    }


    const newTask: Task = {
      id: generateId(), 
      isCompleted: false,
      rewardPoints: rewardPoints, 
      name: taskData.name,
      description: taskData.description,
      hasNeuroBoost: taskData.hasNeuroBoost,
    };
    
    this.db.tasks.push(newTask);
    return newTask;
  }

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

    if (updatedData.isCompleted && !originalTask.isCompleted) {
        this.updateStreak();
    }

    return this.db.tasks[taskIndex];
  }

  deleteTask(taskId: string): boolean {
    const initialLength = this.db.tasks.length;
    this.db.tasks = this.db.tasks.filter((task) => task.id !== taskId);
    return this.db.tasks.length < initialLength;
  }

  getTasks(): Task[] {
    return [...this.db.tasks]; 
  }

  getTask(taskId: string): Task | null {
    const task = this.db.tasks.find((task) => task.id === taskId);
    return task ? { ...task } : null; 
  }
  
  private updateStreak() {
      const today = getDayOfYear(new Date());
      if (this.lastCompletedDay === null || this.lastCompletedDay < today - 1) {
          this.user.streak = 1; 
      } else if (this.lastCompletedDay === today - 1) {
          this.user.streak += 1; 
      }
      this.lastCompletedDay = today;
  }

  public resetStreak() {
      this.user.streak = 0;
      this.lastCompletedDay = null; 
  }

  async getSuggestedTasks(moodLogs: MoodLog[], hormoneLevels: User['hormoneLevels'], completedTasks: User['completedTasks']): Promise<TaskSuggestionsOutput | null> {
    if (!this.user || !hormoneLevels || !completedTasks) {
      console.warn("User data incomplete for task suggestions.");
      return null;
    }
    try {
      const taskSuggestionsInput: TaskSuggestionsInput = {
        moodLogs: moodLogs,
        hormoneLevels: hormoneLevels,
        completedTasks: completedTasks,
      };
      const suggestionsOutput: TaskSuggestionsOutput = await getTaskSuggestions(taskSuggestionsInput);
      return suggestionsOutput;
    } catch (error) {
      console.error("Failed to get task suggestions:", error);
      return null;
    }
  }

  // This method is kept for explicitness but its core logic is now also in createTask
  async calculateRewardPointsForTask(taskDescription: string, userMood: string, hormoneLevels: User['hormoneLevels']): Promise<number> {
    const rewardPointsInput: CalculateRewardPointsInput = {
      taskDescription,
      userMood,
      hormoneLevels,
    };
    return calculateRewardPoints(rewardPointsInput);
  }
}

export default TaskService;
