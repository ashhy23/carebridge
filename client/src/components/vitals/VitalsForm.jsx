/**
 * Patient-only form to log new vitals readings.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { buildVitalsPayload } from '../../lib/vitalsUtils';

const INITIAL_FORM = {
  heartRate: '',
  systolicBp: '',
  diastolicBp: '',
  bloodOxygen: '',
  temperature: '',
  weight: '',
  notes: '',
};

const FIELD_RULES = {
  heartRate: { min: 30, max: 200, label: 'Heart Rate' },
  systolicBp: { min: 70, max: 200, label: 'Systolic BP' },
  diastolicBp: { min: 40, max: 130, label: 'Diastolic BP' },
  bloodOxygen: { min: 70, max: 100, label: 'Blood Oxygen' },
  temperature: { min: 35, max: 42, label: 'Temperature', decimal: true },
  weight: { min: 0, max: 500, label: 'Weight', decimal: true, optional: true },
};

const INPUT_CLASS =
  'w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const INPUT_ERROR_CLASS =
  'w-full rounded-xl border border-red-500 bg-[rgba(255,255,255,0.05)] px-3 py-2 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20';

function validateField(name, value) {
  if (value === '') return '';

  const rule = FIELD_RULES[name];
  if (!rule) return '';

  const num = Number(value);
  if (Number.isNaN(num)) return `${rule.label} must be a number`;
  if (num < rule.min || num > rule.max) {
    return `${rule.label} must be between ${rule.min} and ${rule.max}`;
  }

  if (rule.decimal && !/^\d+(\.\d)?$/.test(value)) {
    return `${rule.label} allows at most one decimal place`;
  }

  return '';
}

function validateForm(form) {
  const errors = {};

  Object.keys(FIELD_RULES).forEach((field) => {
    const error = validateField(field, form[field]);
    if (error) errors[field] = error;
  });

  if (form.notes.length > 500) {
    errors.notes = 'Notes must be 500 characters or fewer';
  }

  const hasMetric = Object.keys(FIELD_RULES).some((field) => form[field] !== '');
  if (!hasMetric && !form.notes.trim()) {
    errors.form = 'Enter at least one vital sign or a note';
  }

  return errors;
}

export default function VitalsForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/vitals', payload);
      return data;
    },
    onSuccess: () => {
      setForm(INITIAL_FORM);
      setErrors({});
      setSuccessMessage('Vitals logged successfully.');
      queryClient.invalidateQueries({ queryKey: ['vitals'] });
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err) => {
      setErrors({
        form: err.response?.data?.error || 'Failed to log vitals. Please try again.',
      });
    },
  });

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '', form: '' }));
      setSuccessMessage('');
    };
  }

  function handleBlur(field) {
    const error = validateField(field, form[field]);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    mutation.mutate(buildVitalsPayload(form));
  }

  function fieldClass(field) {
    return errors[field] ? INPUT_ERROR_CLASS : INPUT_CLASS;
  }

  return (
    <div className="rounded-2xl border border-cb-border bg-cb-card p-6">
      <h3 className="text-lg font-semibold text-white">Log Vitals</h3>
      <p className="mt-1 text-sm text-gray-400">
        Record today&apos;s readings. All fields are optional — log only what you measured.
      </p>

      {successMessage && (
        <p className="mt-4 text-sm text-cb-lime">{successMessage}</p>
      )}

      {errors.form && (
        <p className="mt-4 text-sm text-red-400">{errors.form}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="heartRate" className="mb-1 block text-sm text-gray-300">
              Heart Rate (bpm)
            </label>
            <input
              id="heartRate"
              type="number"
              min={30}
              max={200}
              value={form.heartRate}
              onChange={handleChange('heartRate')}
              onBlur={() => handleBlur('heartRate')}
              className={fieldClass('heartRate')}
              placeholder="e.g. 72"
            />
            {errors.heartRate && (
              <p className="mt-1 text-sm text-red-400">{errors.heartRate}</p>
            )}
          </div>

          <div>
            <label htmlFor="systolicBp" className="mb-1 block text-sm text-gray-300">
              Systolic BP (mmHg)
            </label>
            <input
              id="systolicBp"
              type="number"
              min={70}
              max={200}
              value={form.systolicBp}
              onChange={handleChange('systolicBp')}
              onBlur={() => handleBlur('systolicBp')}
              className={fieldClass('systolicBp')}
              placeholder="e.g. 120"
            />
            {errors.systolicBp && (
              <p className="mt-1 text-sm text-red-400">{errors.systolicBp}</p>
            )}
          </div>

          <div>
            <label htmlFor="diastolicBp" className="mb-1 block text-sm text-gray-300">
              Diastolic BP (mmHg)
            </label>
            <input
              id="diastolicBp"
              type="number"
              min={40}
              max={130}
              value={form.diastolicBp}
              onChange={handleChange('diastolicBp')}
              onBlur={() => handleBlur('diastolicBp')}
              className={fieldClass('diastolicBp')}
              placeholder="e.g. 80"
            />
            {errors.diastolicBp && (
              <p className="mt-1 text-sm text-red-400">{errors.diastolicBp}</p>
            )}
          </div>

          <div>
            <label htmlFor="bloodOxygen" className="mb-1 block text-sm text-gray-300">
              Blood Oxygen / SpO2 (%)
            </label>
            <input
              id="bloodOxygen"
              type="number"
              min={70}
              max={100}
              value={form.bloodOxygen}
              onChange={handleChange('bloodOxygen')}
              onBlur={() => handleBlur('bloodOxygen')}
              className={fieldClass('bloodOxygen')}
              placeholder="e.g. 98"
            />
            {errors.bloodOxygen && (
              <p className="mt-1 text-sm text-red-400">{errors.bloodOxygen}</p>
            )}
          </div>

          <div>
            <label htmlFor="temperature" className="mb-1 block text-sm text-gray-300">
              Temperature (°C)
            </label>
            <input
              id="temperature"
              type="number"
              min={35}
              max={42}
              step={0.1}
              value={form.temperature}
              onChange={handleChange('temperature')}
              onBlur={() => handleBlur('temperature')}
              className={fieldClass('temperature')}
              placeholder="e.g. 36.6"
            />
            {errors.temperature && (
              <p className="mt-1 text-sm text-red-400">{errors.temperature}</p>
            )}
          </div>

          <div>
            <label htmlFor="weight" className="mb-1 block text-sm text-gray-300">
              Weight (kg) <span className="text-gray-500">optional</span>
            </label>
            <input
              id="weight"
              type="number"
              min={0}
              step={0.1}
              value={form.weight}
              onChange={handleChange('weight')}
              onBlur={() => handleBlur('weight')}
              className={fieldClass('weight')}
              placeholder="e.g. 68.5"
            />
            {errors.weight && <p className="mt-1 text-sm text-red-400">{errors.weight}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm text-gray-300">
            Notes <span className="text-gray-500">optional</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            maxLength={500}
            value={form.notes}
            onChange={handleChange('notes')}
            className={errors.notes ? INPUT_ERROR_CLASS : INPUT_CLASS}
            placeholder="How are you feeling today?"
          />
          <div className="mt-1 flex justify-between">
            {errors.notes ? (
              <p className="text-sm text-red-400">{errors.notes}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-gray-500">{form.notes.length}/500</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? 'Saving...' : 'Log Vitals'}
        </button>
      </form>
    </div>
  );
}
