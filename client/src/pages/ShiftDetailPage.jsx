import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import StatusBadge from '../components/shifts/StatusBadge';
import TaskList from '../components/shifts/TaskList';
import VoiceRecorder from '../components/shifts/VoiceRecorder';
import api from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { formatShiftTimeRange, getPatientName } from '../lib/shiftsUtils';

const TEXTAREA_CLASS =
  'w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export default function ShiftDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  const canViewShifts = user.role === 'CAREGIVER' || user.role === 'ADMIN';

  const { data: shift, isLoading, isError, error } = useQuery({
    queryKey: ['shifts', id],
    queryFn: async () => {
      const { data } = await api.get(`/shifts/${id}`);
      return data;
    },
    enabled: Boolean(id) && canViewShifts,
  });

  useEffect(() => {
    if (shift) {
      setNotes(shift.notes || '');
    }
  }, [shift]);

  const statusMutation = useMutation({
    mutationFn: async (status) => {
      const { data } = await api.patch(`/shifts/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', id] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const notesMutation = useMutation({
    mutationFn: async (notesText) => {
      const { data } = await api.patch(`/shifts/${id}/notes`, { notes: notesText });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', id] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    },
  });

  const summaryMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/ai/care-summary', { shiftId: id });
      return data.summary;
    },
  });

  if (!canViewShifts) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleStatusAction() {
    if (shift.status === 'SCHEDULED') {
      statusMutation.mutate('IN_PROGRESS');
    } else if (shift.status === 'IN_PROGRESS') {
      statusMutation.mutate('COMPLETED');
    }
  }

  function handleSaveNotes(e) {
    e.preventDefault();
    notesMutation.mutate(notes);
  }

  function handleTranscript(text) {
    setNotes((prev) => (prev.trim() ? `${prev}\n${text}` : text));
  }

  const canUpdateStatus = user.role === 'CAREGIVER';
  const showStartButton = canUpdateStatus && shift?.status === 'SCHEDULED';
  const showCompleteButton = canUpdateStatus && shift?.status === 'IN_PROGRESS';

  return (
    <div className="min-h-screen bg-cb-bg">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link
          to="/shifts"
          className="mb-6 inline-flex text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          ← Back to Shifts
        </Link>

        {isLoading && (
          <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
            <p className="text-gray-500">Loading shift...</p>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
            <p className="text-sm text-red-400">
              {error.response?.data?.error || 'Failed to load shift. Please try again.'}
            </p>
          </div>
        )}

        {shift && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{getPatientName(shift)}</h2>
                <StatusBadge status={shift.status} />
              </div>
              <p className="mt-2 text-gray-400">
                {formatShiftTimeRange(shift.startTime, shift.endTime)}
              </p>

              {statusMutation.isError && (
                <p className="mt-4 text-sm text-red-400">
                  {statusMutation.error.response?.data?.error ||
                    'Failed to update shift status.'}
                </p>
              )}

              {(showStartButton || showCompleteButton) && (
                <button
                  type="button"
                  onClick={handleStatusAction}
                  disabled={statusMutation.isPending}
                  className={[
                    'mt-6 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60',
                    showCompleteButton
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700',
                  ].join(' ')}
                >
                  {statusMutation.isPending
                    ? 'Updating...'
                    : showStartButton
                      ? 'Start Shift'
                      : 'Complete Shift'}
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
              <h3 className="text-lg font-semibold text-white">Care Notes</h3>
              <p className="mt-1 text-sm text-gray-400">
                {user.role === 'CAREGIVER'
                  ? 'Record observations and updates from this shift.'
                  : 'Notes recorded by the assigned caregiver.'}
              </p>

              {notesSaved && (
                <p className="mt-4 text-sm text-cb-lime">Notes saved!</p>
              )}

              {notesMutation.isError && (
                <p className="mt-4 text-sm text-red-400">
                  {notesMutation.error.response?.data?.error || 'Failed to save notes.'}
                </p>
              )}

              <form onSubmit={handleSaveNotes} className="mt-4 space-y-4">
                {user.role === 'CAREGIVER' &&
                  shift.status !== 'COMPLETED' &&
                  shift.status !== 'CANCELLED' && (
                    <VoiceRecorder onTranscript={handleTranscript} />
                  )}
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  readOnly={user.role !== 'CAREGIVER'}
                  className={TEXTAREA_CLASS}
                  placeholder="Add care notes for this shift..."
                />
                {user.role === 'CAREGIVER' && (
                  <button
                    type="submit"
                    disabled={notesMutation.isPending}
                    className="rounded-xl border border-cb-border px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {notesMutation.isPending ? 'Saving...' : 'Save Notes'}
                  </button>
                )}
              </form>
            </div>

            <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
              <h3 className="text-lg font-semibold text-white">Tasks</h3>
              <p className="mt-1 text-sm text-gray-400">Checklist items for this shift.</p>
              <TaskList shiftId={id} shiftStatus={shift.status} userRole={user.role} />
            </div>

            {user.role === 'CAREGIVER' && shift.status === 'COMPLETED' && (
              <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
                <h3 className="text-lg font-semibold text-white">AI Care Summary</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Auto-generated summary based on notes, tasks and recent vitals.
                </p>

                <button
                  type="button"
                  onClick={() => summaryMutation.mutate()}
                  disabled={summaryMutation.isPending}
                  className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {summaryMutation.isPending ? 'Generating...' : 'Generate Summary'}
                </button>

                {summaryMutation.isError && (
                  <p className="mt-4 text-sm text-red-400">
                    {summaryMutation.error?.response?.data?.error ||
                      'Failed to generate summary. Please try again.'}
                  </p>
                )}

                {summaryMutation.data && (
                  <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-relaxed text-gray-300">
                    {summaryMutation.data}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
