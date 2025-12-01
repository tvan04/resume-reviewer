import { useEffect, useState } from 'react';
import { listResumeVersions, restoreVersion, deleteResumeVersion, ResumeVersion } from './resumeRepo';
import { Button } from './ui/button';
import { Download, RefreshCw, Trash2 } from 'lucide-react';

interface VersionHistoryProps {
  resumeId: string;
  currentVersion?: number;
  onRestored?: () => void;
}

export function VersionHistory({ resumeId, currentVersion, onRestored }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listResumeVersions(resumeId);
      setVersions(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const handleRestore = async (versionId?: string) => {
    if (!versionId) return;
    setBusyId(versionId);
    try {
      await restoreVersion(resumeId, versionId);
      await load();
      onRestored?.();
    } catch (err: any) {
      alert(err?.message || 'Restore failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (versionId?: string) => {
    if (!versionId) return;
    if (!confirm('Delete this version permanently?')) return;
    setBusyId(versionId);
    try {
      await deleteResumeVersion(resumeId, versionId);
      await load();
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">Previous Versions</h4>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={load} aria-label="Refresh versions">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading versions…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {versions.length === 0 && <p className="text-sm text-gray-500">No previous versions</p>}

        {versions.map((v) => (
          <div key={v.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div>
              <p className="text-sm font-medium">v{v.versionNumber}</p>
              <p className="text-xs text-gray-600">{v.fileName ?? 'file'}</p>
              <p className="text-xs text-gray-500">
                {v.uploadedAt ? (typeof v.uploadedAt === 'string' ? new Date(v.uploadedAt).toLocaleString() : (v.uploadedAt.toDate ? v.uploadedAt.toDate().toLocaleString() : 'Unknown')) : 'Unknown'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {v.downloadURL && (
                <a href={v.downloadURL} target="_blank" rel="noreferrer" className="inline-flex">
                  <Button variant="outline" size="sm"><Download className="w-4 h-4" />&nbsp;Download</Button>
                </a>
              )}

              <Button
                size="sm"
                onClick={() => handleRestore(v.id)}
                disabled={busyId === v.id}
                className="whitespace-nowrap"
              >
                Restore
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(v.id)}
                disabled={busyId === v.id}
                aria-label="Delete version"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {currentVersion !== undefined && (
        <div className="mt-3 text-xs text-gray-500">
          Current version: <strong>v{currentVersion}</strong>
        </div>
      )}
    </div>
  );
}