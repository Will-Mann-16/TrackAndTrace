import React from "react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; 

export default function RichTextEditor({ value, onChange, readOnly, ...props }) {
  return (
    <ReactQuill
      {...props}
      readOnly={readOnly}
      value={value || ''}
      onChange={onChange}
    />
  );
}
