
import type { Task } from '@/types/task';
import type { User } from '@/types/user';
import { getDayOfYear } from 'date-fns';
import { generateId } from '@/lib/utils';
// Corrected import: Removed SuggestedTask as it's not directly exported.
// The structure of a suggestion is defined within TaskSuggestionsOutput.
import { getTaskSuggestions, type TaskSuggestionsInput, type TaskSuggestionsOutput } from '@/ai/flows/task-suggestions'; 
// Import the server action instead of directly importing the tool
import { calculateTaskRewardPointsAction } from '@/actions/task-actions';
import type { CalculateRewardPointsInput } from '@/ai/tools/calculate-reward-points'; // Keep type import
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
      let newStreak = 1; 
      // This logic might need to be part of UserContext/AuthContext to correctly manage user's streak
      // For now, it's a utility assuming correct lastCompletedDay is passed.
      if (lastCompletedDay === today -1 || (today === 0 && lastCompletedDay === 365) ) { // consecutive day
        // This part of streak calculation is simplified; actual user streak should increment based on their data
        newStreak = (lastCompletedDay ? 1 : 0) + 1; // Placeholder, real streak comes from user object
      }
      return { newStreak, newLastCompletedDay: today}; 
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
        moodLogs: moodLogs.map(log => ({ 
            date: log.date,
            mood: log.mood,
            activities: Array.isArray(log.activities) ? log.activities : (typeof log.activities === 'string' ? log.activities.split(',').map(s=>s.trim()).filter(s=>s) : []),
            notes: log.notes
        })),
        hormoneLevels: hormoneLevels,
        completedTasks: completedTasks?.filter(task => task.isCompleted).map(task => ({
            id: task.id,
            name: task.name,
            description: task.description,
            rewardPoints: task.rewardPoints,
            isCompleted: task.isCompleted,
            hasNeuroBoost: task.hasNeuroBoost,
        })) || [],
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
    try {
      // Call the server action instead of the direct AI tool function
      const points = await calculateTaskRewardPointsAction(rewardPointsInput);
      return points;
    } catch (error) {
        console.error("Failed to calculate reward points with AI, returning default:", error);
        // Fallback logic if AI tool fails
        let basePoints = 15;
        if (taskDescription.toLowerCase().includes("meditat")) basePoints +=5;
        if (taskDescription.toLowerCase().includes("exercise") || taskDescription.toLowerCase().includes("workout")) basePoints +=10;
        if (userMood === "Stressed" || userMood === "Anxious") basePoints +=5; // Extra points for challenging tasks when mood is low
        return Math.min(30, Math.max(10, basePoints));
    }
  }
}

export default TaskService;
