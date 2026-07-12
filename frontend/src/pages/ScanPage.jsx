// Public QR scan page — no login required
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const STATUS_COLORS = {
  available:         'bg-emerald-100 text-emerald-700',
  allocated:         'bg-indigo-100 text-indigo-700',
  reserved:          'bg-sky-100 text-sky-700',
  under_maintenance: 'bg-amber-100 text-amber-700',
  lost:              'bg-red-100 text-red-700',
  retired:           'bg-gray-200 text-gray-600',
  disposed:          'bg-gray-200 text-gray-500',
};

const PRIORITY_COLORS = {
  low: 'text-gray-500', medium: 'text-amber-600', high: 'text-orange-600', critical: 'text-red-600',
};

const RESULT_COLORS = {
  verified: 'text-emerald-600', missing: 'text-red-600', damaged: 'text-amber-600',
};

function Row({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 text-sm last:border-0">
      <span className="text-gray-400 w-44 shrink-0">{label}</span>
      <span className="text-gray-800 text-right break-all">{value}</span>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function fmt(date) { return date ? new Date(date).toLocaleDateString() : null; }
function isPast(date) { return date && new Date(date) < new Date(); }

export default function ScanPage() {
  const { tag } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // No Authorization header — public endpoint
    fetch(`/api/assets/scan/${encodeURIComponent(tag)}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Failed to load asset info. Make sure you are on the same network.'));
  }, [tag]);

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">❌</div>
        <p className="text-gray-700 font-medium">{error}</p>
        <p className="text-gray-400 text-xs font-mono mt-1">{tag}</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Loading asset info…</p>
    </div>
  );

  const { asset, allocation, maintenance, history, transfers, audits } = data;

  const openMaintenance  = maintenance.filter((m) => !['resolved', 'rejected'].includes(m.status));
  const lastResolved     = maintenance.find((m) => m.status === 'resolved');
  // Next maintenance due: earliest expected_return_date among open requests, or null
  const nextMaintenanceDue = openMaintenance
    .map((m) => m.created_at)
    .sort()[0] || null;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">

      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          {asset.image_url
            ? <img src={asset.image_url} alt={asset.name} className="h-16 w-16 object-cover rounded-lg border-2 border-white/30 shrink-0" />
            : <div className="h-16 w-16 rounded-lg bg-indigo-500 flex items-center justify-center text-3xl shrink-0">📦</div>
          }
          <div className="min-w-0">
            <p className="text-indigo-200 text-xs font-mono">{asset.asset_tag}</p>
            <h1 className="text-xl font-bold leading-tight truncate">{asset.name}</h1>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[asset.status]}`}>
              {asset.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">

        {/* Basic Details */}
        <Section title="Basic Details" icon="🏷️">
          <Row label="Asset Tag"     value={asset.asset_tag} />
          <Row label="Asset Name"    value={asset.name} />
          <Row label="Category"      value={asset.category_name} />
          <Row label="Brand"         value={asset.brand} />
          <Row label="Model"         value={asset.model} />
          <Row label="Serial Number" value={asset.serial_number} />
          <Row label="Condition"     value={asset.condition} />
          <Row label="Bookable"      value={asset.is_bookable ? 'Yes' : 'No'} />
          <Row label="Current Status" value={asset.status.replace(/_/g, ' ')} />
        </Section>

        {/* Location */}
        <Section title="Location" icon="📍">
          {asset.location
            ? <Row label="Location" value={asset.location} />
            : <p className="text-sm text-gray-400">No location recorded.</p>
          }
        </Section>

        {/* Allocation Details */}
        <Section title="Allocation Details" icon="👤">
          {allocation ? (
            <>
              <Row label="Current Holder"    value={allocation.employee_name} />
              <Row label="Department"        value={allocation.department_name} />
              <Row label="Allocated By"      value={allocation.allocated_by_name} />
              <Row label="Allocation Date"   value={fmt(allocation.allocated_at)} />
              <Row label="Expected Return"   value={fmt(allocation.expected_return_date)} />
              {isPast(allocation.expected_return_date) && (
                <div className="mt-2 text-xs text-red-600 font-medium bg-red-50 rounded-lg px-3 py-2">
                  ⚠ Return is overdue
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">Not currently allocated.</p>
          )}
        </Section>

        {/* Purchase Information */}
        <Section title="Purchase Information" icon="🧾">
          <Row label="Purchase Date"   value={fmt(asset.acquisition_date)} />
          <Row label="Cost"            value={asset.acquisition_cost ? `₹${Number(asset.acquisition_cost).toLocaleString()}` : null} />
          <Row label="Vendor"          value={asset.vendor} />
          <Row label="Warranty Expiry" value={fmt(asset.warranty_expiry)} />
          {isPast(asset.warranty_expiry) && (
            <div className="mt-2 text-xs text-red-600 font-medium bg-red-50 rounded-lg px-3 py-2">
              ⚠ Warranty has expired
            </div>
          )}
          {!asset.acquisition_date && !asset.acquisition_cost && !asset.vendor && !asset.warranty_expiry && (
            <p className="text-sm text-gray-400">No purchase info recorded.</p>
          )}
        </Section>

        {/* Maintenance */}
        <Section title="Maintenance" icon="🔧">
          <Row label="Last Maintenance"    value={fmt(lastResolved?.resolved_at)} />
          <Row label="Next Maintenance Due" value={fmt(nextMaintenanceDue)} />
          <Row label="Open Requests"       value={openMaintenance.length || 'None'} />
          {openMaintenance.length > 0 && (
            <div className="mt-2 space-y-2">
              {openMaintenance.map((m, i) => (
                <div key={i} className="bg-amber-50 rounded-lg px-3 py-2 text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`font-semibold text-xs uppercase ${PRIORITY_COLORS[m.priority]}`}>{m.priority}</span>
                    <span className="text-xs text-gray-400 capitalize">{m.status.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-gray-700 mt-0.5">{m.issue}</p>
                  <p className="text-gray-400 text-xs mt-0.5">Raised by {m.raised_by_name} · {fmt(m.created_at)}</p>
                </div>
              ))}
            </div>
          )}
          {maintenance.length === 0 && <p className="text-sm text-gray-400 mt-1">No maintenance records.</p>}
        </Section>

        {/* Asset History — Previous Owners */}
        <Section title="Asset History" icon="📋">
          {history.length === 0
            ? <p className="text-sm text-gray-400">No allocation history.</p>
            : history.map((h) => (
              <div key={h.id} className="py-2 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{h.employee_name || h.department_name || '—'}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${h.status === 'active' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    {h.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmt(h.allocated_at)} → {h.returned_at ? fmt(h.returned_at) : 'present'}
                  {h.return_notes ? ` · ${h.return_notes}` : ''}
                </p>
              </div>
            ))
          }
        </Section>

        {/* Transfers */}
        <Section title="Transfers" icon="🔄">
          {transfers.length === 0
            ? <p className="text-sm text-gray-400">No transfer records.</p>
            : transfers.map((t) => (
              <div key={t.id} className="py-2 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">→ {t.to_employee_name || t.to_department_name || '—'}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    t.status === 'approved' ? 'bg-emerald-100 text-emerald-600'
                    : t.status === 'rejected' ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-600'}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Requested by {t.requested_by_name} · {fmt(t.created_at)}
                  {t.reason ? ` · ${t.reason}` : ''}
                </p>
              </div>
            ))
          }
        </Section>

        {/* Audit Records */}
        <Section title="Audit Records" icon="✅">
          {audits.length === 0
            ? <p className="text-sm text-gray-400">No audit records.</p>
            : audits.map((a, i) => (
              <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{a.cycle_name}</span>
                  <span className={`text-xs font-semibold capitalize ${RESULT_COLORS[a.result]}`}>{a.result}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmt(a.audited_at)} · by {a.audited_by_name}
                  {a.notes ? ` · ${a.notes}` : ''}
                </p>
              </div>
            ))
          }
        </Section>

        <p className="text-center text-xs text-gray-300 pt-2">AssetFlow · {asset.asset_tag}</p>
      </div>
    </div>
  );
}
