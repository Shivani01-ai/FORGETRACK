import React, { useState } from 'react';
import { extractRawData, prepareAiSample } from '../../lib/aiParser';
import { analyzeAttendanceSheet, listAvailableModels } from '../../lib/gemini';
import { supabase } from '../../lib/supabase';
import { FileUp, Layers, Cpu, CheckCircle2, AlertTriangle, Loader2, Calendar } from 'lucide-react';
import Modal from '../Modal';

const STEPS = [
  { id: 'upload', label: 'Upload File', icon: FileUp },
  { id: 'sheets', label: 'Select Sheets', icon: Layers },
  { id: 'ai', label: 'AI Mapping', icon: Cpu },
  { id: 'review', label: 'Review & Save', icon: CheckCircle2 }
];

export default function UploadWizard() {
  const [currentStep, setCurrentStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [rawResult, setRawResult] = useState(null);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [aiMappings, setAiMappings] = useState({}); // { sheetName: mappingData }
  const [typicalDays, setTypicalDays] = useState('Tuesday, Thursday');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ current: 0, total: 0, message: '' });

  // 1. File Selection
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setLoading(true);
    try {
      const result = await extractRawData(selectedFile);
      setFile(selectedFile);
      setRawResult(result);
      
      if (result.type === 'csv' || result.sheets.length === 1) {
        setSelectedSheets([result.sheets[0].name]);
        setCurrentStep('ai');
        runAiAnalysis();
      } else {
        setCurrentStep('sheets');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [conflicts, setConflicts] = useState({}); // { sheetName: [dates] }

  // 2. AI Analysis
  const runAiAnalysis = async () => {
    setLoading(true);
    try {
      const newMappings = { ...aiMappings };
      const newConflicts = { ...conflicts };

      for (const sheetName of selectedSheets) {
        const sheet = rawResult.sheets.find(s => s.name === sheetName);
        if (!sheet) continue;

        const sample = prepareAiSample(sheet.data);
        const mapping = await analyzeAttendanceSheet(sample, typicalDays);
        
        // Check for duplicates
        const detectedDates = mapping.attendanceColumns.map(c => c.date);
        const { data: existingSessions } = await supabase
          .from('sessions')
          .select('date')
          .in('date', detectedDates);
        
        if (existingSessions && existingSessions.length > 0) {
          newConflicts[sheetName] = existingSessions.map(s => s.date);
        }

        newMappings[sheetName] = mapping;
      }

      setAiMappings(newMappings);
      setConflicts(newConflicts);
      setCurrentStep('review');
    } catch (err) {
      console.error('AI Analysis Error:', err);
      alert('AI Analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Final Save Logic
  const handleFinalSave = async () => {
    setLoading(true);
    try {
      for (const sheetName of selectedSheets) {
        const sheet = rawResult.sheets.find(s => s.name === sheetName);
        const mapping = aiMappings[sheetName];
        if (!mapping) continue;

        const data = sheet.data;
        const headers = data[0];
        const studentRows = data.slice(1);

        // Batch Students first
        const studentsToUpsert = studentRows.map(row => {
          const s = {};
          Object.entries(mapping.studentMapping).forEach(([dbField, config]) => {
            if (config && typeof config.index === 'number') {
              s[dbField] = row[config.index];
            }
          });
          return s;
        }).filter(s => s.usn);

        setUploadStatus({ current: 1, total: 3, message: 'Upserting students...' });
        const { data: upsertedStudents, error: stdError } = await supabase
          .from('students')
          .upsert(studentsToUpsert, { onConflict: 'usn' })
          .select();

        if (stdError) throw stdError;

        // Batch Sessions
        setUploadStatus({ current: 2, total: 3, message: 'Creating sessions...' });
        const sessionsToUpsert = mapping.attendanceColumns.map(col => ({
          date: col.date,
          topic: `Bulk Upload: ${file.name} (${sheetName})`,
          month_number: 1, // Fallback
          session_type: 'offline'
        }));

        const { data: upsertedSessions, error: sessError } = await supabase
          .from('sessions')
          .upsert(sessionsToUpsert, { onConflict: 'date' })
          .select();

        if (sessError) throw sessError;

        // Batch Attendance
        setUploadStatus({ current: 3, total: 3, message: 'Recording attendance...' });
        const attendanceToInsert = [];
        studentRows.forEach(row => {
          const usnConfig = mapping.studentMapping.usn;
          if (!usnConfig || typeof usnConfig.index !== 'number') return;
          const usn = row[usnConfig.index];
          const student = upsertedStudents.find(s => s.usn === usn);
          if (!student) return;

          mapping.attendanceColumns.forEach(col => {
            const session = upsertedSessions.find(s => s.date === col.date);
            if (!session) return;

            const val = row[col.index];
            // Normalize presence check
            const presentVal = String(mapping.valueFormat.present).toLowerCase();
            const normalizedVal = String(val).toLowerCase();
            const isPresent = normalizedVal === presentVal || val === true || normalizedVal === 'p' || normalizedVal === '1';
            
            attendanceToInsert.push({
              student_id: student.id,
              session_id: session.id,
              present: isPresent,
              marked_by: 'AI Bulk Upload'
            });
          });
        });

        const { error: attError } = await supabase
          .from('attendance')
          .upsert(attendanceToInsert, { onConflict: 'student_id,session_id' });

        if (attError) throw attError;
      }

      alert('Successfully uploaded and mapped data!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error during upload: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl shadow-[var(--shadow-card)] border border-border-subtle overflow-hidden">
      {/* Wizard Header */}
      <div className="flex border-b border-border-subtle bg-surface-raised">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          return (
            <div 
              key={step.id}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-caption font-medium tracking-wider uppercase transition-colors ${isActive ? 'text-accent-glow bg-surface border-b-2 border-accent-glow' : 'text-fg-tertiary'}`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className="p-10 min-h-[400px] flex flex-col">
        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-accent-glow/10 flex items-center justify-center text-accent-glow">
              <FileUp size={40} />
            </div>
            <div className="max-w-md">
              <h2 className="text-h2 text-fg-primary mb-2">Upload Attendance Sheet</h2>
              <p className="text-body text-fg-secondary">Select a CSV or XLSX file. Our AI will handle mapping and gap filling.</p>
            </div>
            
            {/* Typical Days Input */}
            <div className="w-full max-w-sm p-6 bg-surface-inset rounded-2xl border border-border-subtle">
              <label className="text-label text-fg-tertiary block mb-3 text-left">TYPICAL CLASS DAYS</label>
              <input 
                type="text"
                value={typicalDays}
                onChange={e => setTypicalDays(e.target.value)}
                placeholder="e.g. Monday, Wednesday, Friday"
                className="w-full bg-surface-raised border border-border-default rounded-lg px-4 h-11 text-fg-primary focus:border-accent-glow outline-none"
              />
              <p className="text-[11px] text-fg-tertiary mt-2 text-left">Used by AI to fill gaps if headers are missing dates.</p>
            </div>

            <input 
              type="file" 
              id="file-upload" 
              hidden 
              accept=".csv,.xlsx,.xls" 
              onChange={handleFileChange}
            />
            <label 
              htmlFor="file-upload"
              className="bg-fg-primary text-canvas px-10 py-4 rounded-md font-medium cursor-pointer hover:bg-[#E5E5E7] transition-all inline-flex items-center gap-2 shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
              Select File to Analyze
            </label>

            {/* Debug Button */}
            <button 
              onClick={async () => {
                try {
                  const models = await listAvailableModels();
                  alert("Your API key has access to these models:\n" + models.join("\n"));
                } catch (err) {
                  alert("API Check Failed: " + err.message);
                }
              }}
              className="mt-4 text-caption text-fg-tertiary hover:text-fg-secondary underline"
            >
              Check API Access & Models
            </button>
          </div>
        )}

        {/* Step 2: Sheet Selection */}
        {currentStep === 'sheets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-h2 text-fg-primary">Select Sheets</h2>
                <p className="text-body text-fg-secondary">Select one or more sheets containing attendance data.</p>
              </div>
              <button
                onClick={runAiAnalysis}
                disabled={selectedSheets.length === 0 || loading}
                className="bg-fg-primary text-canvas px-6 py-2.5 rounded-md font-medium hover:bg-[#E5E5E7] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Cpu size={18} />}
                Analyze {selectedSheets.length} Selected
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rawResult?.sheets.map(sheet => {
                const isSelected = selectedSheets.includes(sheet.name);
                return (
                  <button
                    key={sheet.name}
                    onClick={() => {
                      setSelectedSheets(prev => 
                        prev.includes(sheet.name) 
                          ? prev.filter(s => s !== sheet.name) 
                          : [...prev, sheet.name]
                      );
                    }}
                    className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden ${
                      isSelected 
                        ? 'border-accent-glow bg-accent-glow/5 shadow-[0_0_15px_rgba(var(--accent-glow-rgb),0.1)]' 
                        : 'border-border-default bg-surface-inset hover:border-border-strong hover:bg-surface-raised'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-accent-glow">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                    <div className="text-body font-medium text-fg-primary mb-1">{sheet.name}</div>
                    <div className="text-caption text-fg-tertiary">{sheet.data.length} rows detected</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: AI Progress */}
        {loading && currentStep === 'ai' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <Loader2 className="animate-spin text-accent-glow" size={60} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu size={24} className="text-accent-glow" />
              </div>
            </div>
            <div>
              <h2 className="text-h2 text-fg-primary mb-2">AI is Analyzing...</h2>
              <p className="text-body text-fg-secondary">Mapping headers and identifying dates from the sample data.</p>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 'review' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-h2 text-fg-primary">Review AI Mapping</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentStep('upload')}
                  className="px-4 py-2 text-caption font-medium uppercase text-fg-secondary hover:text-fg-primary"
                >
                  Cancel
                </button>
              </div>
            </div>

            {selectedSheets.map(name => (
              <div key={name} className="space-y-6">
                <div className="p-6 rounded-xl border border-border-default bg-surface-inset">
                  <h3 className="text-label text-fg-tertiary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-success" />
                    Sheet: {name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Student Mapping */}
                    <div className="space-y-4">
                      <div className="text-caption text-fg-secondary font-medium">STUDENT FIELDS</div>
                      <div className="space-y-2">
                        {Object.entries(aiMappings[name]?.studentMapping || {}).map(([db, config]) => (
                          <div key={db} className="flex justify-between items-center p-3 bg-surface-raised rounded-md border border-border-subtle">
                            <span className="text-body-sm text-fg-tertiary uppercase">{db}</span>
                            <span className="text-body-sm text-fg-primary font-medium">{config?.colName || <span className="text-danger">Not Found</span>}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Attendance Dates */}
                    <div className="space-y-4">
                      <div className="text-caption text-fg-secondary font-medium">DETECTED DATES ({aiMappings[name]?.attendanceColumns.length})</div>
                      <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                        {aiMappings[name]?.attendanceColumns.map((col, idx) => {
                          const isConflict = conflicts[name]?.includes(col.date);
                          return (
                            <div key={idx} className={`flex justify-between items-center p-3 rounded-md border ${isConflict ? 'bg-warning/10 border-warning/30' : 'bg-surface-raised border-border-subtle'}`}>
                              <div className="flex items-center gap-2">
                                {isConflict ? <AlertTriangle size={14} className="text-warning" /> : col.isSuggested ? <AlertTriangle size={14} className="text-fg-tertiary" /> : <Calendar size={14} className="text-fg-tertiary" />}
                                <span className="text-body-sm text-fg-primary font-medium">{col.date}</span>
                                {isConflict && <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Exists</span>}
                              </div>
                              <span className="text-caption text-fg-tertiary">{col.originalHeader}</span>
                            </div>
                          );
                        })}
                      </div>
                      {conflicts[name] && (
                        <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg flex gap-3">
                          <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
                          <p className="text-caption text-fg-secondary leading-relaxed">
                            Warning: <strong>{conflicts[name].length} sessions</strong> already exist in the database for these dates. Proceeding will overwrite their attendance data.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleFinalSave}
                    disabled={loading}
                    className="bg-accent-glow text-white px-10 py-4 rounded-md font-medium text-lg hover:brightness-110 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(var(--accent-glow-rgb),0.3)]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        {uploadStatus.message}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Confirm & Import
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
