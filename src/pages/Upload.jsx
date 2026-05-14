import React from 'react';
import UploadWizard from '../components/upload/UploadWizard';

export default function Upload() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-display-lg text-fg-primary mb-2">Bulk Attendance Upload</h1>
        <p className="text-body-lg text-fg-secondary">
          Upload your class spreadsheets. Our AI agent will identify students, map dates, and fill any gaps automatically.
        </p>
      </div>

      <UploadWizard />
      
      {/* Instructions / Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="p-8 rounded-2xl bg-surface border border-border-subtle shadow-sm">
          <h3 className="text-h3 text-fg-primary mb-4 flex items-center gap-2">
            💡 Pro Tip: Missing Headers
          </h3>
          <p className="text-body-sm text-fg-secondary leading-relaxed">
            If your spreadsheet has columns without date headers, the AI will use your "Typical Days" setting to suggest the most likely dates based on the sequence of columns.
          </p>
        </div>
        <div className="p-8 rounded-2xl bg-surface border border-border-subtle shadow-sm">
          <h3 className="text-h3 text-fg-primary mb-4 flex items-center gap-2">
            🛡️ Duplicate Detection
          </h3>
          <p className="text-body-sm text-fg-secondary leading-relaxed">
            The system automatically checks if a session for a specific date already exists. You'll be prompted to confirm if you want to overwrite or skip those records.
          </p>
        </div>
      </div>
    </div>
  );
}
