import React, { useRef, useState } from 'react';
import { 
  isAllowedFileType, 
  isImageMimeType, 
  formatFileSize, 
  MAX_FILE_SIZE,
  type Attachment,
  type UploadProgress 
} from '../../types/attachment';
import { showError } from '../../utils/toast';

interface AttachmentPickerProps {
  onFilesSelected: (files: File[]) => void;
  onUploadComplete?: (attachments: Attachment[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  onFilesSelected,
  multiple = true,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Vượt quá 10MB`);
        continue;
      }

      if (!isAllowedFileType(file.name)) {
        errors.push(`${file.name}: Định dạng không được hỗ trợ`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      showError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="p-2 rounded-lg hover:bg-surface-2 dark:hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Đính kèm file"
      >
        <svg
          className="w-5 h-5 text-text-2 dark:text-text-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </button>
    </>
  );
};

interface AttachmentPreviewProps {
  files: File[];
  uploadProgress?: Map<string, UploadProgress>;
  onRemove: (index: number) => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  files,
  uploadProgress,
  onRemove,
}) => {
  if (files.length === 0) return null;

  return (
    <div className="relative z-[60] flex flex-wrap gap-2 p-2 bg-surface-2 dark:bg-surface-2 rounded-lg border border-border dark:border-border shadow-lg">
      {files.map((file, index) => {
        const isImage = isImageMimeType(file.type);
        const progress = uploadProgress?.get(file.name);
        const isUploading = progress?.status === 'uploading';

        return (
          <div
            key={`${file.name}-${index}`}
            className="relative group"
          >
            {isImage ? (
              <ImagePreview file={file} onRemove={() => onRemove(index)} isUploading={isUploading} />
            ) : (
              <FilePreview file={file} onRemove={() => onRemove(index)} isUploading={isUploading} />
            )}
            
            {isUploading && (
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
  isUploading?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onRemove, isUploading }) => {
  const [preview, setPreview] = useState<string>('');

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [file]);

  return (
    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border dark:border-border bg-surface-1 dark:bg-surface-1">
      {preview && (
        <img
          src={preview}
          alt={file.name}
          className="w-full h-full object-cover"
        />
      )}
      {!isUploading && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-5 h-5 bg-danger rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Xóa"
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  isUploading?: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove, isUploading }) => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-1 dark:bg-surface-1 border border-border dark:border-border min-w-[200px] max-w-[300px]">
      <FileIcon ext={ext} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-1 dark:text-text-1 truncate">{file.name}</div>
        <div className="text-xs text-text-3 dark:text-text-3">{formatFileSize(file.size)}</div>
      </div>
      {!isUploading && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-surface-2 dark:hover:bg-surface-2 flex items-center justify-center transition-colors"
          title="Xóa"
        >
          <svg className="w-3 h-3 text-text-2 dark:text-text-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

const FileIcon: React.FC<{ ext: string }> = ({ ext }) => {
  const getIconColor = () => {
    switch (ext) {
      case 'pdf': return 'text-danger';
      case 'doc':
      case 'docx': return 'text-info';
      case 'xls':
      case 'xlsx': return 'text-success';
      case 'txt': return 'text-text-2';
      case 'zip':
      case 'rar': return 'text-warning';
      default: return 'text-text-3';
    }
  };

  return (
    <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center bg-surface-2 dark:bg-surface-2 ${getIconColor()}`}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  );
};
