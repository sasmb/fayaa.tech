import { hfCreateUploadTicket } from "wasp/client/operations"

import { parseUploadTicket, requireUploadContentType } from "./upload-contract"

export async function uploadMedia(file: File): Promise<{ url: string }> {
  const contentType = requireUploadContentType(file.type)
  let payload: unknown
  try {
    payload = await hfCreateUploadTicket({ contentType })
  } catch (caught) {
    throw new Error(
      caught instanceof Error && caught.message
        ? caught.message
        : "Could not prepare reference upload with Higgsfield. Try again."
    )
  }
  const ticket = parseUploadTicket(payload, contentType)
  // The storage request must not carry the platform key or browser cookies.
  const uploaded = await fetch(ticket.upload_url, {
    method: "PUT",
    headers: ticket.upload_headers,
    body: file,
    credentials: "omit",
  })
  if (!uploaded.ok)
    throw new Error(
      `Reference upload failed (${uploaded.status}). Try uploading the file again.`
    )
  return { url: ticket.public_url }
}
