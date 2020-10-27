import React, { useState } from "react";
import { Upload as U, message } from "antd";
import { useFirebase } from "../firebase";
import { v4 as uuid } from "uuid";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import styled, { css } from "styled-components";

const Up = styled(U)`
  ${({ fluid }) =>
    !fluid &&
    css`
      & > .ant-upload {
        width: 128px;
        height: 128px;
      }
    `}
`;

export default function Upload({
  value,
  onChange,
  getName = () => uuid(),
  folder,
  ...props
}) {
  const firebase = useFirebase();
  const [loading, setLoading] = useState(false);
  return (
    <Up
      listType='picture-card'
      {...props}
      customRequest={({ onProgress, onError, onSuccess, file }) => {
        const uploadFile = async () => {
          try {
            setLoading(true);
            const url = await firebase.uploadFile(
              file,
              getName() + "." + file.type.split("/")[1],
              folder,
              (percent) => onProgress({ percent: percent.toFixed(2) })
            );
            onSuccess(url);
            setLoading(false);
          } catch (e) {
            onError(e);
          }
        };
        uploadFile();
      }}
      onSuccess={onChange}
      beforeUpload={(file) => {
        const isJpgOrPng =
          file.type === "image/jpeg" || file.type === "image/png";
        if (!isJpgOrPng) {
          message.error("You can only upload JPG/PNG file!");
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
          message.error("Image must smaller than 2MB!");
        }
        return isJpgOrPng && isLt2M;
      }}
      fileList={[]}
    >
      {value ? (
        <img src={value} alt='avatar' style={{ width: "100%" }} />
      ) : (
        <div>
          {loading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>Upload</div>
        </div>
      )}
    </Up>
  );
}
