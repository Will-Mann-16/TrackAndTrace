import React from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useFirebase } from "../firebase";
import { v4 as uuid } from "uuid";

import ImageUploader from "quill-image-uploader";

Quill.register("modules/imageUploader", ImageUploader);
export default function RichTextEditor({
  value,
  onChange,
  readOnly,
  ...props
}) {
  const firebase = useFirebase();
  return (
    <ReactQuill
      {...props}
      readOnly={readOnly}
      value={value || ""}
      onChange={onChange}
      modules={{
        toolbar: [
          [{ header: [2, 3] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [
            { list: "ordered" },
            { list: "bullet" },
            { indent: "-1" },
            { indent: "+1" },
          ],
          ["link", "image"],
          ["clean"],
        ],
        imageUploader: {
          upload: (file) =>
            firebase.uploadFile(
              file,
              uuid() + "." + file.type.split("/")[1],
              "/rich-text/",
              null
            ),
        },
      }}
      formats={[
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "blockquote",
        "list",
        "bullet",
        "indent",
        "link",
        "image",
      ]}
    />
  );
}
