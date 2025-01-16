import { useState, useEffect } from 'react';
import { Upload, Globe, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface DataSourceInputProps {
  onDataLoad?: (data: string) => void;
  className?: string;
  defaultOpen?: boolean;
}

export function DataSourceInput({ onDataLoad, className, defaultOpen = false }: DataSourceInputProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onDataLoad?.(text);
      setOpen(false);
    };
    reader.readAsText(file);
  };

  const handleUrlSubmit = async () => {
    try {
      setError('');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data');
      const text = await response.text();
      onDataLoad?.(text);
      setOpen(false);
    } catch (err) {
      setError('Failed to load data from URL');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className={className} title="Upload Route Data">
          <Upload className="w-4 h-4" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[400px]">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Load Route Data
          </Dialog.Title>

          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <h3 className="font-medium mb-2">Upload File</h3>
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors">
                <div className="text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.ts,.json"
                    onChange={handleFileUpload}
                  />
                </div>
              </label>
            </div>

            {/* URL Input */}
            <div>
              <h3 className="font-medium mb-2">Load from URL</h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  )}
                </div>
                <button
                  onClick={handleUrlSubmit}
                  disabled={!url}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Globe className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <Dialog.Close asChild>
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}