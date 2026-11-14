import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  FileCheck,
  Info
} from 'lucide-react';

interface QueuedFile {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'failed';
  stage?: string;
  error?: string;
  taskId?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFileQueue([]);
    setIsProcessingQueue(false);
    setIsDragOver(false);
  };

  const handleFiles = (files: FileList | File[]) => {
    const validPdfs: QueuedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        validPdfs.push({
          id: `${file.name}-${Date.now()}-${i}`,
          file,
          status: 'queued',
        });
      }
    }

    if (validPdfs.length === 0) {
      alert('Please select valid PDF documents (.pdf).');
      return;
    }

    setFileQueue((prev) => [...prev, ...validPdfs]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFileFromQueue = (id: string) => {
    if (isProcessingQueue) return;
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const pollTask = async (taskId: string, queueItemId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const check = async () => {
        try {
          const task = await api.getTask(taskId);
          setFileQueue((prev) =>
            prev.map((item) => {
              if (item.id === queueItemId) {
                return {
                  ...item,
                  status: task.status === 'COMPLETED' ? 'completed' : task.status === 'FAILED' ? 'failed' : 'processing',
                  stage: task.current_stage,
                  error: task.error_message || undefined
                };
              }
              return item;
            })
          );

          if (task.status === 'COMPLETED') {
            resolve(true);
          } else if (task.status === 'FAILED') {
            resolve(false);
          } else {
            setTimeout(check, 1000);
          }
        } catch (err: any) {
          setFileQueue((prev) =>
            prev.map((item) =>
              item.id === queueItemId
                ? { ...item, status: 'failed', error: err.message || 'Task polling error' }
                : item
            )
          );
          resolve(false);
        }
      };
      check();
    });
  };

  const startBatchProcessing = async () => {
    if (fileQueue.length === 0 || isProcessingQueue) return;

    setIsProcessingQueue(true);

    for (let i = 0; i < fileQueue.length; i++) {
      const current = fileQueue[i];
      if (current.status === 'completed') continue;

      // Update state to uploading
      setFileQueue((prev) =>
        prev.map((item) =>
          item.id === current.id ? { ...item, status: 'uploading', stage: 'Uploading document...' } : item
        )
      );

      try {
        const task = await api.uploadPaper(current.file);
        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === current.id ? { ...item, status: 'processing', taskId: task.id, stage: 'Analyzing text & sections...' } : item
          )
        );

        await pollTask(task.id, current.id);
      } catch (err: any) {
        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === current.id ? { ...item, status: 'failed', error: err.message || 'Upload failed' } : item
          )
        );
      }
    }

    setIsProcessingQueue(false);
    onUploadSuccess();
  };

  const completedCount = fileQueue.filter((f) => f.status === 'completed').length;
  const failedCount = fileQueue.filter((f) => f.status === 'failed').length;
  const allDone = fileQueue.length > 0 && (completedCount + failedCount === fileQueue.length);

  const handleClose = () => {
    if (isProcessingQueue) return;
    resetState();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Research Papers"
      size="xl"
    >
      <div className="space-y-5">
        {/* Academic Guidance */}
        <div className="p-3.5 bg-archival-950 rounded-lg border border-archival-800 text-xs text-archival-300 space-y-1">
          <div className="flex items-center space-x-2 font-medium text-archival-200">
            <Info className="w-4 h-4 text-forest-400 shrink-0" />
            <span>Supported Formats & Multi-Paper Analysis</span>
          </div>
          <p className="text-archival-400 leading-relaxed text-xs">
            Select one or more academic research papers in <strong>PDF format</strong> (max 50 MB each).
            To compare methodologies, detect opposing findings, or ask cross-study questions, upload at least two related papers.
          </p>
        </div>

        {/* Drop Zone */}
        {!isProcessingQueue && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              isDragOver
                ? 'border-forest-500 bg-forest-950/20'
                : 'border-archival-750 hover:border-forest-600/60 bg-archival-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2.5">
              <div className="p-3 bg-archival-900 border border-archival-750 rounded-xl text-forest-400 shadow-sm">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-archival-200 block">
                  Click to select PDFs or drag and drop files here
                </span>
                <span className="text-[11px] text-archival-400 block">
                  Multiple PDFs supported (e.g. 2 to 10 research papers)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Selected / Queued Files List */}
        {fileQueue.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-archival-400 px-1 font-mono">
              <span>Paper Queue ({fileQueue.length})</span>
              {allDone && (
                <span className="text-forest-400 font-medium">
                  {completedCount} processed successfully {failedCount > 0 && `(${failedCount} failed)`}
                </span>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {fileQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-archival-950 rounded-lg border border-archival-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <FileText className="w-4 h-4 text-forest-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-archival-200 font-medium truncate block" title={item.file.name}>
                        {item.file.name}
                      </span>
                      <span className="text-[10px] text-archival-400 font-mono">
                        {formatFileSize(item.file.size)}
                        {item.stage && ` • ${item.stage}`}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 flex items-center space-x-2">
                    {item.status === 'queued' && (
                      <span className="text-[11px] text-archival-400 px-2 py-0.5 rounded bg-archival-900 border border-archival-750 font-mono">
                        Queued
                      </span>
                    )}

                    {item.status === 'uploading' && (
                      <span className="text-[11px] text-forest-300 px-2 py-0.5 rounded bg-forest-950 border border-forest-800 flex items-center gap-1.5 font-mono">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Uploading
                      </span>
                    )}

                    {item.status === 'processing' && (
                      <span className="text-[11px] text-forest-300 px-2 py-0.5 rounded bg-forest-950 border border-forest-800 flex items-center gap-1.5 font-mono">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Analyzing
                      </span>
                    )}

                    {item.status === 'completed' && (
                      <span className="text-[11px] text-forest-300 px-2 py-0.5 rounded bg-forest-950 border border-forest-800 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-400" />
                        Ready
                      </span>
                    )}

                    {item.status === 'failed' && (
                      <div className="flex items-center space-x-1.5 text-rose-400 text-[11px]" title={item.error}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="max-w-[120px] truncate">{item.error || 'Failed'}</span>
                      </div>
                    )}

                    {item.status === 'queued' && !isProcessingQueue && (
                      <button
                        onClick={() => removeFileFromQueue(item.id)}
                        className="p-1 rounded text-archival-500 hover:text-rose-400 hover:bg-archival-900 transition cursor-pointer"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-archival-800 text-xs">
          <span className="text-archival-400">
            {allDone
              ? 'All selected documents processed.'
              : fileQueue.length > 0
              ? `${fileQueue.length} ${fileQueue.length === 1 ? 'document' : 'documents'} ready to process`
              : 'Select PDF documents to begin'}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              disabled={isProcessingQueue}
              className="px-4 py-2 rounded-lg bg-archival-850 hover:bg-archival-800 text-archival-300 transition cursor-pointer disabled:opacity-40 border border-archival-750"
            >
              {allDone ? 'Done' : 'Cancel'}
            </button>

            {!allDone && fileQueue.length > 0 && (
              <button
                onClick={startBatchProcessing}
                disabled={isProcessingQueue || fileQueue.length === 0}
                className="px-5 py-2 rounded-lg bg-forest-600 hover:bg-forest-500 active:bg-forest-700 text-white font-medium transition cursor-pointer flex items-center space-x-2 disabled:opacity-50"
              >
                {isProcessingQueue ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Papers...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Process {fileQueue.length} {fileQueue.length === 1 ? 'Paper' : 'Papers'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
