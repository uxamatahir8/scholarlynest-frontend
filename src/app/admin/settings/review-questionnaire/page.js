'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Save, Trash2 } from 'lucide-react';
import api from '../../../../utils/api';
import { safeApiMessage } from '../../../../utils/safeErrors';
import { useAuth } from '../../../../context/AuthContext';
import { Button } from '../../../../components/ui/Button';
import Field from '../../../../components/ui/Field';
import { Input, Select } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import Alert from '../../../../components/ui/Alert';
import LoadingState from '../../../../components/ui/LoadingState';
import ErrorState from '../../../../components/ui/ErrorState';

const emptyQuestion = () => ({ prompt: '', comment_helper: '', response_type: 'radio', is_required: true, options: ['Yes', 'No'] });
const optionTypes = new Set(['radio', 'checkbox', 'dropdown']);

export default function ReviewQuestionnaireSettingsPage() {
  const searchParams = useSearchParams();
  const { user, hasRole, loading: authLoading } = useAuth();
  const [name, setName] = useState('General Reviewer Questionnaire');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const observerReadonly = searchParams.get('observer_readonly') === '1'
    || searchParams.has('observer_user')
    || searchParams.has('observer_user_id');
  const canManage = hasRole('super_admin') && !observerReadonly;

  useEffect(() => {
    if (authLoading || !canManage) {
      setLoading(false);
      return;
    }
    api.get('/admin/review-questionnaire')
      .then((response) => {
        const questionnaire = response.data?.questionnaire;
        if (questionnaire) {
          setName(questionnaire.name || name);
          const active = questionnaire.active_version?.questions || [];
          if (active.length > 0) {
            setQuestions(active.map((question) => ({
              prompt: question.prompt || '',
              comment_helper: question.comment_helper || '',
              response_type: question.response_type || 'radio',
              is_required: !!question.is_required,
              options: question.options?.length ? question.options : [''],
            })));
          }
        }
      })
      .catch((err) => setError(safeApiMessage(err, 'Unable to load reviewer questionnaire.')))
      .finally(() => setLoading(false));
  }, [authLoading, canManage]);

  const updateQuestion = (index, field, value) => {
    setQuestions(questions.map((question, idx) => (idx === index ? { ...question, [field]: value } : question)));
  };

  const save = async () => {
    if (!canManage) return;
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

  if (authLoading || loading) return <LoadingState label="Loading reviewer questionnaire..." className="min-h-[320px]" />;
  if (!user || !canManage) {
    return <ErrorState title={observerReadonly ? 'Observer mode is read-only' : 'Super Admin access required'}>Reviewer questionnaire settings are restricted to Super Admins.</ErrorState>;
  }

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
          <div key={index} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 transition-all hover:border-[var(--border-hover)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[var(--foreground)]">Question {index + 1}</p>
              <button type="button" onClick={() => setQuestions(questions.filter((_, idx) => idx !== index))} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <Field label="Question Text" required>
              <Textarea value={question.prompt} onChange={(event) => updateQuestion(index, 'prompt', event.target.value)} rows={2} placeholder="e.g. Does this manuscript require major revisions?" />
            </Field>
            <div className="mt-3">
              <Field label="Optional Comment Helper">
                <Input value={question.comment_helper || ''} onChange={(event) => updateQuestion(index, 'comment_helper', event.target.value)} placeholder="e.g. If No, suggest modification." />
              </Field>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="Answer Type">
                <Select
                  value={question.response_type}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    const defaultOptions = optionTypes.has(nextType) && (!question.options || question.options.length === 0 || (question.options.length === 1 && !question.options[0]))
                      ? ['Yes', 'No']
                      : question.options || [];
                    setQuestions(questions.map((q, idx) => (idx === index ? { ...q, response_type: nextType, options: defaultOptions } : q)));
                  }}
                >
                  <option value="radio">Single Choice (Radio Buttons)</option>
                  <option value="checkbox">Multiple Choice (Checkboxes)</option>
                  <option value="dropdown">Dropdown Select</option>
                  <option value="single_line">Short Text (Single Line)</option>
                  <option value="textarea">Long Text (Paragraph)</option>
                </Select>
              </Field>
              <label className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground)] cursor-pointer">
                <input type="checkbox" checked={question.is_required} onChange={(event) => updateQuestion(index, 'is_required', event.target.checked)} />
                Required
              </label>
            </div>
            {optionTypes.has(question.response_type) && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Answer Options</p>
                <div className="space-y-2">
                  {(question.options || []).map((option, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <Input
                        value={option}
                        placeholder={`Option ${optIdx + 1}`}
                        onChange={(event) => {
                          const nextOpts = [...(question.options || [])];
                          nextOpts[optIdx] = event.target.value;
                          updateQuestion(index, 'options', nextOpts);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextOpts = (question.options || []).filter((_, oIdx) => oIdx !== optIdx);
                          updateQuestion(index, 'options', nextOpts);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={() => {
                    updateQuestion(index, 'options', [...(question.options || []), '']);
                  }}
                >
                  Add Option
                </Button>
              </div>
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
