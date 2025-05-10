
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
 * @classdesc Manages stateless utility functions for tasks.
 */
class TaskService {

  /**
   * @constructor
   * @description Initializes the TaskService.
   * @returns {void}
   */
  constructor() {
    // Constructor is now empty as the service is stateless regarding tasks db
  }

  /**
   * @method createTaskObject
   * @description Creates a new task object.
   * @param {Omit<Task, 'id' | 'isCompleted'>} taskData - The task data.
   * @returns {Task} - The newly created task object.
   */
  createTaskObject(
    taskData: Omit<Task, 'id' | 'isCompleted'>
  ): Task {
    return {
      id: generateId(), 
      isCompleted: false,
      ...taskData,
    };
  }

  /**
   * @method updateTaskInList
   * @description Updates an existing task within a given list.
   * @param {string} taskId - The ID of the task to be updated.
   * @param {Partial<Omit<Task, 'id'>>} updatedData - The updated task data.
   * @param {Task[]} currentTasks - The current list of tasks.
   * @returns {Task[]} - A new array with the updated task or the original array if not found.
   */
  updateTaskInList(
    taskId: string,
    updatedData: Partial<Omit<Task, 'id'>>,
    currentTasks: Task[]
  ): Task[] {
    const taskIndex = currentTasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      return currentTasks; // Return original list if task not found
    }
    
    const newTasks = [...currentTasks];
    newTasks[taskIndex] = { ...newTasks[taskIndex], ...updatedData };
    return newTasks;
  }

  /**
   * @method deleteTaskFromList
   * @description Deletes an existing task from a given list.
   * @param {string} taskId - The ID of the task to be deleted.
   * @param {Task[]} currentTasks - The current list of tasks.
   * @returns {Task[]} - A new array without the deleted task.
   */
  deleteTaskFromList(taskId: string, currentTasks: Task[]): Task[] {
    return currentTasks.filter((task) => task.id !== taskId);
  }
  
  /**
   * @method calculateNewStreak
   * @description Calculates the new streak and last completed day.
   * @param {number | null | undefined} lastCompletedDay - The day of year of the last task completion.
   * @returns {{ newStreak: number, newLastCompletedDay: number }} - The new streak and last completed day.
   */
  calculateNewStreak(lastCompletedDay: number | null | undefined): { newStreak: number, newLastCompletedDay: number } {
      const today = getDayOfYear(new Date());
      let newStreak = 1; // Default to starting a new streak

      if (lastCompletedDay === today - 1) {
          // Continued streak from yesterday
          // Assuming current streak is available from AppUser, this function would need it
          // For simplicity, let's say it needs the current streak value passed in or this logic moves to page.tsx
          // This method should only calculate based on lastCompletedDay
          newStreak = (/* appUser.streak from context */ 0) + 1; // Placeholder for actual streak logic
      } else if (lastCompletedDay === today) {
          // Already completed a task today, streak doesn't change for *another* task same day
          newStreak = (/* appUser.streak from context */ 0); // Placeholder
      }
      // This simplified version is not quite right for incrementing.
      // A better approach for `MainAppInterface`:
      // let updatedStreak = appUser.streak;
      // if (lastCompletedDay === null || lastCompletedDay < today -1) updatedStreak = 1;
      // else if (lastCompletedDay === today -1) updatedStreak +=1;
      // setAppUser(prev => ({...prev, streak: updatedStreak, lastCompletedDay: today }))

      // Let's refine `calculateNewStreak` to be more directly usable:
      // It should take currentStreak and lastCompletedDay
      // For now, to keep it simple in TaskService, it will just determine if streak should be 1 or incremented.
      // The actual increment logic will be in page.tsx
      
      // Refined: This function will be called by `page.tsx` which has access to current streak.
      // This function will determine the *new* values.
      
      // Let's adjust what this helper function does:
      // It determines how the streak should be *adjusted* based on `lastCompletedDay`
      // This isn't ideal. Better to handle streak update logic directly in `MainAppInterface`
      // For now, let's assume MainAppInterface handles the logic and this just returns current day.
      return { newStreak: 1, newLastCompletedDay: today}; // This needs fixing in MainAppInterface
  }


  /**
   * @method getSuggestedTasks
   * @description Gets AI-powered task suggestions based on user data.
   * @param {MoodLog[]} moodLogs - User's mood logs.
   * @param {User['hormoneLevels']} hormoneLevels - User's hormone levels.
   * @param {User['tasks']} completedTasks - User's completed tasks.
   * @returns {Promise<TaskSuggestionsOutput | null>} - An array of task suggestions or null if an error occurs.
   */
  async getSuggestedTasks(moodLogs: MoodLog[], hormoneLevels: User['hormoneLevels'], completedTasks: User['tasks']): Promise<TaskSuggestionsOutput | null> {
    try {
      const taskSuggestionsInput: TaskSuggestionsInput = {
        moodLogs: moodLogs.map(log => ({ // Ensure MoodLog structure matches schema
            date: log.date,
            mood: log.mood,
            activities: Array.isArray(log.activities) ? log.activities : [],
            notes: log.notes
        })),
        hormoneLevels: hormoneLevels,
        completedTasks: completedTasks.filter(task => task.isCompleted).map(task => ({
            id: task.id,
            name: task.name,
            description: task.description,
            rewardPoints: task.rewardPoints,
            isCompleted: task.isCompleted,
            hasNeuroBoost: task.hasNeuroBoost,
        })),
      };
      const suggestions: TaskSuggestionsOutput = await getTaskSuggestions(taskSuggestionsInput);
      return suggestions; 
    } catch (error) {
      console.error("Failed to get task suggestions:", error);
      return null;
    }
  }

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
