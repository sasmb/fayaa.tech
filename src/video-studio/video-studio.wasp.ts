import { action, job, page, query, route, type Spec } from "@wasp.sh/spec";

import { VideoStudioPage } from "./VideoStudioPage" with { type: "ref" };
import {
  createGenjutsuTask,
  getVideoTaskStatus,
  getUserVideoTasks,
  submitLongVideoGenjutsu,
  getLongVideoJobStatus,
  getUserLongVideoJobs,
  cancelLongVideoJob,
  hfSubmitGeneration,
  hfGetGenerationStatuses,
  hfCancelGeneration,
  hfHasPlatformCredentials,
  hfSavePlatformCredentials,
  hfClearPlatformCredentials,
  hfCreateUploadTicket,
} from "./operations" with { type: "ref" };
import { checkVideoTasksJob } from "./jobs" with { type: "ref" };

export const videoStudioSpec: Spec = [
  route(
    "StudioRoute",
    "/studio",
    page(VideoStudioPage)
  ),
  action(createGenjutsuTask, { entities: ["User", "VideoTask"] }),
  query(getVideoTaskStatus, { entities: ["User", "VideoTask"] }),
  query(getUserVideoTasks, { entities: ["User", "VideoTask"] }),
  action(submitLongVideoGenjutsu, { entities: ["User", "LongVideoJob", "LongVideoSegment"] }),
  query(getLongVideoJobStatus, { entities: ["User", "LongVideoJob", "LongVideoSegment"] }),
  query(getUserLongVideoJobs, { entities: ["User", "LongVideoJob", "LongVideoSegment"] }),
  action(cancelLongVideoJob, { entities: ["User", "LongVideoJob", "LongVideoSegment"] }),
  action(hfSubmitGeneration, { entities: ["User", "VideoTask"] }),
  action(hfGetGenerationStatuses, { entities: ["User", "VideoTask"] }),
  action(hfCancelGeneration, { entities: ["User", "VideoTask"] }),
  query(hfHasPlatformCredentials, { entities: [] }),
  action(hfSavePlatformCredentials, { entities: [] }),
  action(hfClearPlatformCredentials, { entities: [] }),
  action(hfCreateUploadTicket, { entities: ["User"] }),
  job(checkVideoTasksJob, {
    executor: "PgBoss",
    schedule: {
      cron: "* * * * *", // Runs every minute to poll in-progress video tasks
    },
    entities: ["User", "VideoTask", "LongVideoJob", "LongVideoSegment", "Logs"],
  }),
];
