import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import * as path from "path";
import { env } from "wasp/server";
import { MAX_FILE_SIZE_BYTES } from "./validation";

export const s3Client = new S3Client({
  region: env.AWS_S3_REGION || "auto",
  endpoint: env.R2_ENDPOINT || undefined,
  credentials: {
    accessKeyId: env.AWS_S3_IAM_ACCESS_KEY || "",
    secretAccessKey: env.AWS_S3_IAM_SECRET_KEY || "",
  },
});

type S3Upload = {
  fileType: string;
  fileName: string;
  userId: string;
};

export function getPublicUrlForS3Key(s3Key: string): string | undefined {
  if (env.R2_PUBLIC_URL) {
    const base = env.R2_PUBLIC_URL.replace(/\/$/, "");
    return `${base}/${s3Key}`;
  }
  return undefined;
}

export const getUploadFileSignedURLFromS3 = async ({
  fileName,
  fileType,
  userId,
}: S3Upload) => {
  const s3Key = getS3Key(fileName, userId);
  const publicUrl = getPublicUrlForS3Key(s3Key);

  // Cloudflare R2 requires standard presigned PUT requests (createPresignedPost is not supported by R2)
  if (env.R2_ENDPOINT) {
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_FILES_BUCKET!,
      Key: s3Key,
      ContentType: fileType,
    });
    const s3UploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return { s3UploadUrl, s3Key, s3UploadFields: {}, publicUrl };
  }

  const { url: s3UploadUrl, fields: s3UploadFields } =
    await createPresignedPost(s3Client, {
      Bucket: env.AWS_S3_FILES_BUCKET!,
      Key: s3Key,
      Conditions: [["content-length-range", 0, MAX_FILE_SIZE_BYTES]],
      Fields: {
        "Content-Type": fileType,
      },
      Expires: 3600,
    });

  return { s3UploadUrl, s3Key, s3UploadFields, publicUrl };
};

export const getDownloadFileSignedURLFromS3 = async ({
  s3Key,
}: {
  s3Key: string;
}) => {
  const publicUrl = getPublicUrlForS3Key(s3Key);
  if (publicUrl) {
    return publicUrl;
  }
  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_FILES_BUCKET,
    Key: s3Key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const deleteFileFromS3 = async ({ s3Key }: { s3Key: string }) => {
  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_FILES_BUCKET,
    Key: s3Key,
  });
  await s3Client.send(command);
};

export const checkFileExistsInS3 = async ({ s3Key }: { s3Key: string }) => {
  const command = new HeadObjectCommand({
    Bucket: env.AWS_S3_FILES_BUCKET,
    Key: s3Key,
  });
  try {
    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === "NotFound") {
      return false;
    }
    throw error;
  }
};

function getS3Key(fileName: string, userId: string) {
  const ext = path.extname(fileName).slice(1);
  return `${userId}/${randomUUID()}.${ext}`;
}
