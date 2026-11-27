import type { CheckVideoTasksJob } from "wasp/server/jobs";
import { uploadLocalFileToS3 } from "../file-upload/s3Utils";
import { createPlatformClient } from "./hf/generation/platform";
import { defaultLongVideoMediaOps, syncLongVideoJob } from "./longVideoProcessor";
import { createMuapiClient, warnOnLowMuapiBalance } from "./muapi";
import { SEEDANCE_VARIANT } from "./seedancePlanning";
import { syncSeedanceJob } from "./seedanceProcessor";
import { syncVideoTaskStatus } from "./taskSync";

/**
 * Lightweight Wasp background job (PgBoss worker) that periodically checks
 * any VideoTasks in "PROCESSING" state.
 *
 * Runs every minute to ensure renders from Higgsfield and MuAPI (1-4 min)
 * are verified and updated into user history even if the browser tab was closed.
 */
export const checkVideoTasksJob: CheckVideoTasksJob<never, void> = async (
  _args,
  context
) => {
  try {
    const processingTasks = await context.entities.VideoTask.findMany({
      where: {
        status: "PROCESSING",
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 25,
    });

    if (processingTasks.length === 0) {
      return;
    }

    console.log(
      `[checkVideoTasksJob] Polling ${processingTasks.length} in-progress video task(s)...`
    );

    const results = await Promise.allSettled(
      processingTasks.map((task) =>
        syncVideoTaskStatus(task, context.entities)
      )
    );

    const completed = results.filter(
      (r) => r.status === "fulfilled" && r.value.status === "COMPLETED"
    ).length;
    const failed = results.filter(
      (r) => r.status === "fulfilled" && r.value.status === "FAILED"
    ).length;

    if (completed > 0 || failed > 0) {
      console.log(
        `[checkVideoTasksJob] Batch results: ${completed} completed, ${failed} failed.`
      );
    }

    const activeLongJobs = await context.entities.LongVideoJob.findMany({
      where: {
        status: {
          // STITCHING is included so jobs interrupted mid-stitch get refunded.
          in: ["SPLITTING", "PROCESSING_CLIPS", "STITCHING"],
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 10,
    });

    const seedanceJobs = activeLongJobs.filter((job) => job.variant === SEEDANCE_VARIANT);
    const genjutsuJobs = activeLongJobs.filter((job) => job.variant !== SEEDANCE_VARIANT);
    const mediaOps = defaultLongVideoMediaOps(uploadLocalFileToS3);

    const apiKey = process.env.HF_CREDENTIALS?.trim();
    if (genjutsuJobs.length > 0 && apiKey) {
      const baseUrl = (
        process.env.HF_API_BASE_URL || "https://api.higgsfield.ai"
      ).replace(/\/+$/, "");
      const platformClient = createPlatformClient({ apiKey, baseUrl });

      await Promise.allSettled(
        genjutsuJobs.map((job) =>
          syncLongVideoJob({
            job,
            entities: context.entities,
            platformClient,
            mediaOps,
          })
        )
      );
    }

    const muapiKey = process.env.MUAPI_API_KEY?.trim();
    if (seedanceJobs.length > 0 && muapiKey) {
      const muapi = createMuapiClient(muapiKey, fetch, warnOnLowMuapiBalance);
      await Promise.allSettled(
        seedanceJobs.map((job) =>
          syncSeedanceJob({ job, entities: context.entities, muapi, mediaOps })
        )
      );
    }
  } catch (error) {
    console.error("[checkVideoTasksJob] Worker error polling tasks:", error);
    try {
      if (context.entities.Logs) {
        await context.entities.Logs.create({
          data: {
            message: `[checkVideoTasksJob] Worker error: ${
              error instanceof Error ? error.message : String(error)
            }`,
            level: "job-error",
          },
        });
      }
    } catch (logErr) {
      console.error("[checkVideoTasksJob] Failed to write log:", logErr);
    }
  }
};
