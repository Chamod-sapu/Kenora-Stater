import { useState } from 'react';
import api, { errMsg } from '../api';

const toLocalInput = (iso) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function WorkshopForm({ workshop, onSaved, onCancel }) {
  const [f, setF] = useState({
    code: workshop?.code ?? '', title: workshop?.title ?? '', instructor: workshop?.instructor ?? '',
    startsAt: workshop ? toLocalInput(workshop.startsAt) : '', durationMinutes: workshop?.durationMinutes ?? 60,
    capacity: workshop?.capacity ?? 10, location: workshop?.location ?? '', category: workshop?.category ?? '',
    description: workshop?.description ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    const body = {
      ...f, startsAt: new Date(f.startsAt).toISOString(),
      durationMinutes: Number(f.durationMinutes), capacity: Number(f.capacity),
    };
    try {
      const { data } = workshop ? await api.patch(`/workshops/${workshop.id}`, body) : await api.post('/workshops', body);
      onSaved(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="row">
        <input placeholder="Code (e.g. POT-101)" value={f.code} onChange={set('code')} required />
        <input placeholder="Title" value={f.title} onChange={set('title')} required />
        <input placeholder="Instructor" value={f.instructor} onChange={set('instructor')} required />
      </div>
      <div className="row">
        <input type="datetime-local" value={f.startsAt} onChange={set('startsAt')} required />
        <input type="number" min="15" placeholder="Minutes" value={f.durationMinutes} onChange={set('durationMinutes')} required />
        <input type="number" min="1" placeholder="Capacity" value={f.capacity} onChange={set('capacity')} required />
      </div>
      <div className="row">
        <input placeholder="Location" value={f.location} onChange={set('location')} required />
        <input placeholder="Category" value={f.category} onChange={set('category')} />
      </div>
      <textarea placeholder="Description" rows={2} value={f.description} onChange={set('description')} />
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}