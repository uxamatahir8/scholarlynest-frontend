'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import api from '../../../../utils/api';
import { safeApiMessage } from '../../../../utils/safeErrors';
import { Button } from '../../../../components/ui/Button';
import Field from '../../../../components/ui/Field';
import { Input, Select } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import Alert from '../../../../components/ui/Alert';
import LoadingState from '../../../../components/ui/LoadingState';

const emptyQuestion = () => ({ prompt: '', response_type: 'radio', is_required: true, options: ['Yes', 'No'] });
const optionTypes = new Set(['radio', 'checkbox', 'dropdown']);

export default function ReviewQuestionnaireSettingsPage() {
  const [name, setName] = useState('General Reviewer Questionnaire');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/review-questionnaire')
      .then((response) => {
        const questionnaire = response.data?.questionnaire;
        if (questionnaire) {
          setName(questionnaire.name || name);
          const active = questionnaire.active_version?.questions || [];
          if (active.length > 0) {
            setQuestions(active.map((question) => ({
              prompt: question.prompt || '',
              response_type: question.response_type || 'radio',
              is_required: !!question.is_required,
              options: question.options?.length ? question.options : [''],
            })));
          }
        }
      })
      .catch((err) => setError(safeApiMessage(err, 'Unable to load reviewer questionnaire.')))
      .finally(() => setLoading(false));
  }, []);

  const updateQuestion = (index, field, value) => {
    setQuestions(questions.map((question, idx) => (idx === index ? { ...question, [field]: value } : question)));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/admin/review-questionnaire', { name, questions });
      setMessage('Reviewer questionnaire version published.');
    } catch (err) {
      setError(safeApiMessage(err, 'Unable to save reviewer questionnaire.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading reviewer questionnaire..." className="min-h-[320px]" />;

  return (
    <main className="space-y-6">
      <title>Reviewer Questionnaire - ScholarlyNest</title>
      <header className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Super Admin</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">Reviewer Questionnaire</h1>
      </header>

      {message && <Alert tone="success" title="Saved">{message}</Alert>}
      {error && <Alert tone="danger" title="Error">{error}</Alert>}

      <section className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <Field label="Questionnaire name" required>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>

        {questions.map((question, index) => (
          <div key={index} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[var(--foreground)]">Question {index + 1}</p>
              <button type="button" onClick={() => setQuestions(questions.filter((_, idx) => idx !== index))} className="text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <Field label="Prompt" required>
              <Textarea value={question.prompt} onChange={(event) => updateQuestion(index, 'prompt', event.target.value)} rows={2} />
            </Field>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="Response type">
                <Select value={question.response_type} onChange={(event) => updateQuestion(index, 'response_type', event.target.value)}>
                  <option value="radio">Radio</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="dropdown">Dropdown select</option>
                  <option value="single_line">Single line answer</option>
                  <option value="textarea">Textarea</option>
                </Select>
              </Field>
              <label className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                <input type="checkbox" checked={question.is_required} onChange={(event) => updateQuestion(index, 'is_required', event.target.checked)} />
                Required
              </label>
            </div>
            {optionTypes.has(question.response_type) && (
              <Field label="Options" className="mt-3">
                <Textarea
                  value={(question.options || []).join('\n')}
                  onChange={(event) => updateQuestion(index, 'options', event.target.value.split('\n'))}
                  rows={4}
                />
              </Field>
            )}
          </div>
        ))}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" icon={Plus} onClick={() => setQuestions([...questions, emptyQuestion()])}>Add Question</Button>
          <Button type="button" icon={Save} isLoading={saving} onClick={save}>Publish Version</Button>
        </div>
      </section>
    </main>
  );
}
