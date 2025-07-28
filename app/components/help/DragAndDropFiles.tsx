import React from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

interface BasicProps {
  onChange: (files: File[]) => void
}

const Basic: React.FC<BasicProps> = ({ onChange }) => {
  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (fileRejections) => {
      const rejectionMessages = fileRejections.flatMap(({ file, errors }) =>
        errors.map(err => {
          if (err.code === 'file-too-large') {
            return `${file.name} is too large. Max size is 1MB.`;
          }
          if (err.code === 'too-many-files') {
            return `You can only upload up to ${MAX_FILES} files.`;
          }
          return `${file.name}: ${err.message}`;
        })
      );

      rejectionMessages.forEach(msg => toast.error(msg));
    },
    onDropAccepted: (files) => {
      onChange(files);
    }
  });

  return (
    <section className="bg-black bg-opacity-30 rounded-lg shadow-md p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-indigo-300 bg-indigo-100/10'
            : 'border-white/20 hover:bg-white/5'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-300">
          Drop your files here, <span className='underline text-[rgb(106,183,166)]'>or click to browse</span> 
        </p>
      </div>
    </section>
  );
}

export default Basic;
