import axios from 'axios';
import { AI_SERVICE_URL } from '../config/serverConfig.js';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 300000, // 5 min — AI calls can take time
  headers: { 'Content-Type': 'application/json' },
});

class AiService {
  // Trigger the AI orchestrator to process a task
  async processTask(taskId, taskData) {
    try {
      const response = await aiClient.post('/api/tasks/process', {
        task_id: taskId,
        user_id: taskData.assignedBy?.toString(),
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        tags: taskData.tags || [],
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.detail || error.message;
      throw new Error(`AI Service error: ${msg}`);
    }
  }

  // Get current status of AI processing for a task
  async getTaskStatus(taskId) {
    try {
      const response = await aiClient.get(`/api/tasks/${taskId}/status`);
      return response.data;
    } catch (error) {
      throw new Error(`AI Service status error: ${error.message}`);
    }
  }

  // Ping AI service health
  async healthCheck() {
    try {
      const response = await aiClient.get('/health');
      return response.data;
    } catch {
      return { status: 'unreachable' };
    }
  }
}

export default new AiService();
