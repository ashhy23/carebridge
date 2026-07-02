import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

const INPUT_CLASS =
  'w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export default function TaskList({ shiftId, shiftStatus, userRole }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const isCaregiver = userRole === 'CAREGIVER';
  const canManageTasks = shiftStatus !== 'CANCELLED';

  const { data: tasks = [], isLoading, isError, error } = useQuery({
    queryKey: ['tasks', shiftId],
    queryFn: async () => {
      const { data } = await api.get('/tasks', { params: { shiftId } });
      return data;
    },
    enabled: Boolean(shiftId),
  });

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/tasks', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', shiftId] });
      setTitle('');
      setDescription('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (taskId) => {
      const { data } = await api.patch(`/tasks/${taskId}/complete`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', shiftId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', shiftId] });
    },
  });

  function handleAddTask(e) {
    e.preventDefault();
    if (!title.trim()) return;

    addMutation.mutate({
      shiftId,
      title: title.trim(),
      description: description.trim() || undefined,
    });
  }

  function getEmptyMessage() {
    if (canManageTasks) {
      return 'No tasks yet. Add one below.';
    }
    return 'No tasks were recorded for this shift.';
  }

  return (
    <div>
      {isLoading && <p className="mt-4 text-sm text-gray-500">Loading tasks...</p>}

      {isError && (
        <p className="mt-4 text-sm text-red-400">
          {error.response?.data?.error || 'Failed to load tasks. Please try again.'}
        </p>
      )}

      {!isLoading && !isError && tasks.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">{getEmptyMessage()}</p>
      )}

      {!isLoading && !isError && tasks.length > 0 && (
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-start gap-3 rounded-xl border border-cb-border bg-[rgba(255,255,255,0.03)] px-4 py-3 ${
                task.isCompleted ? 'opacity-50' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(task.isCompleted)}
                disabled={!isCaregiver || toggleMutation.isPending}
                onChange={() => toggleMutation.mutate(task.id)}
                className="mt-0.5 h-4 w-4 accent-[#d4f53c] disabled:cursor-not-allowed"
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`text-sm font-medium text-white ${
                    task.isCompleted ? 'line-through' : ''
                  }`}
                >
                  {task.title}
                </span>
                {task.description && (
                  <p className="mt-0.5 text-xs text-gray-500">{task.description}</p>
                )}
              </div>
              {isCaregiver && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(task.id)}
                  disabled={deleteMutation.isPending}
                  className="shrink-0 text-sm text-gray-600 transition hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Delete task"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {(addMutation.isError || toggleMutation.isError || deleteMutation.isError) && (
        <p className="mt-4 text-sm text-red-400">
          {addMutation.error?.response?.data?.error ||
            toggleMutation.error?.response?.data?.error ||
            deleteMutation.error?.response?.data?.error ||
            'Something went wrong. Please try again.'}
        </p>
      )}

      {isCaregiver && canManageTasks && (
        <form onSubmit={handleAddTask} className="mt-6 space-y-3 border-t border-cb-border pt-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
            className={INPUT_CLASS}
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className={INPUT_CLASS}
          />
          <button
            type="submit"
            disabled={addMutation.isPending || !title.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addMutation.isPending ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      )}
    </div>
  );
}
