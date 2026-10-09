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
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant flex flex-col max-h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">
                {workshop ? 'edit_square' : 'add_box'}
              </span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface m-0">
                {workshop ? 'Edit Workshop' : 'Create New Workshop'}
              </h2>
              {workshop && <p className="font-body-sm text-body-sm text-on-surface-variant m-0">{workshop.code}</p>}
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
            
            {error && (
              <div className="p-4 rounded-xl bg-error-container text-on-error-container flex items-start gap-2">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span className="font-body-md text-body-md">{error}</span>
              </div>
            )}

            {/* Section 1: Basic Info */}
            <div>
              <h3 className="font-label-lg text-label-lg text-primary uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Code <span className="text-error">*</span></label>
                  <input placeholder="e.g. POT-101" value={f.code} onChange={set('code')} required className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Title <span className="text-error">*</span></label>
                  <input placeholder="Workshop Title" value={f.title} onChange={set('title')} required className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow font-body-md text-on-surface" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Instructor <span className="text-error">*</span></label>
                  <div className="relative">
                    <input placeholder="Lead Instructor Name" value={f.instructor} onChange={set('instructor')} required className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" />
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Category</label>
                  <div className="relative">
                    <input placeholder="e.g. Pottery, Technology" value={f.category} onChange={set('category')} className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Schedule & Capacity */}
            <div>
              <h3 className="font-label-lg text-label-lg text-primary uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">Schedule &amp; Capacity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Starts At <span className="text-error">*</span></label>
                  <input type="datetime-local" value={f.startsAt} onChange={set('startsAt')} required className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow font-body-sm text-on-surface" />
                </div>
                <div className="sm:col-span-1">
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Duration (min) <span className="text-error">*</span></label>
                  <div className="relative">
                    <input type="number" min="15" step="15" value={f.durationMinutes} onChange={set('durationMinutes')} required className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" />
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Seat Capacity <span className="text-error">*</span></label>
                  <div className="relative">
                    <input type="number" min="1" value={f.capacity} onChange={set('capacity')} required className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Location & Details */}
            <div>
              <h3 className="font-label-lg text-label-lg text-primary uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">Location &amp; Description</h3>
              <div className="mb-4">
                <label className="block font-label-md text-label-md text-on-surface mb-1">Location <span className="text-error">*</span></label>
                <div className="relative">
                  <input placeholder="e.g. Lakeside (Studio A)" value={f.location} onChange={set('location')} required className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" />
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Description</label>
                <textarea 
                  placeholder="Provide a short description of the workshop curriculum..." rows={3} 
                  value={f.description} onChange={set('description')} 
                  className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow resize-y font-body-sm text-on-surface" 
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-3">
            <button 
              type="button" onClick={onCancel} disabled={saving}
              className="h-10 px-5 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={saving}
              className="h-10 px-6 rounded-xl font-label-lg text-label-lg bg-primary hover:bg-on-primary-fixed-variant text-on-primary shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {workshop ? 'Save Changes' : 'Create Workshop'}
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}