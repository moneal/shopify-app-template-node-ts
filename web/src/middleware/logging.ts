import morgan from "morgan";
import type express from "express";
import bunyan from "bunyan";
import {
  Options as LoggerOptions,
  LogLevel,
} from "@google-cloud/logging-bunyan/build/src/types/core";
import {
  express as lbExpress,
  LoggingBunyan,
  LOGGING_SPAN_KEY,
  LOGGING_TRACE_KEY,
} from "@google-cloud/logging-bunyan";
import { getOrInjectContext } from "@google-cloud/logging/build/src/utils/context";

interface Options extends LoggerOptions {
  isProd?: boolean;
  level?: LogLevel;
  logName?: string;
  // projectId?: string;
}
interface AnnotatedRequestType<LoggerType> extends express.Request {
  log: LoggerType;
}

let configuredLogger: bunyan | null = null;

export const APP_LOG_SUFFIX = "applog";

// Type safe way of getting the logger.
export const getLogger = <LoggerType>(req?: express.Request) => {
  return req &&
    typeof (req as AnnotatedRequestType<LoggerType>).log === "object"
    ? ((req as AnnotatedRequestType<LoggerType>).log as bunyan)
    : configuredLogger || console;
};

export const setupLogging = async (app: express.Express, options?: Options) => {
  const defaults = {
    logName: "bunyan_log",
    level: "info",
    projectId: process.env.GCP_PROJECT || '__undefined_gcp_product_id__',
  };
  const setOptions = Object.assign({}, defaults, options);

  const loggingBunyanApp = new LoggingBunyan(
    Object.assign({}, options, {
      // For request bundling to work, the parent (request) and child (app) logs
      // need to have distinct names. For exact requirements see:
      // https://cloud.google.com/appengine/articles/logging#linking_app_logs_and_requests
      logName: `${setOptions.logName}_${APP_LOG_SUFFIX}`,
    })
  );

  const logger = bunyan.createLogger({
    name: `${setOptions.logName}_${APP_LOG_SUFFIX}`,
    streams: [
      setOptions.isProd
        ? // GCP
          loggingBunyanApp.stream(setOptions.level)
        : // Log to the console at 'info' and above
          { stream: process.stdout, level: "info" },
    ],
  });
  // const auth = (loggingBunyanApp.cloudLog as any).logging.auth;
  // const [env, projectId] = await Promise.all([
  //   auth.getEnv(),
    // auth.getProjectId(),
  // ]);
  const makeChildLogger = (trace: string, span?: string) => {
    return logger.child(
      { [LOGGING_TRACE_KEY]: trace, [LOGGING_SPAN_KEY]: span },
      true /* simple child */
    );
  };
  const mw = makeMiddleware(setOptions.projectId, makeChildLogger);
  // console.log({ env, projectId });

  app.use(mw);
  if (!setOptions.isProd) {
    // Basic response code output for debugging
    app.use(morgan("dev"));
  }
  configuredLogger = logger;
  // logger.info("🪵 Bunyan Logger middleware added");
  configuredLogger.info("🪵 Bunyan Logger middleware added");
};

function makeMiddleware<LoggerType>(
  projectId: string,
  makeChildLogger: (
    trace: string,
    span?: string,
    traceSampled?: boolean
  ) => LoggerType
) {
  return (req: express.Request, res: express.Response, next: Function) => {
    // TODO(ofrobots): use high-resolution timer.
    const requestStartMs = Date.now();

    // Detect & establish context if we were the first actor to detect lack of
    // context so traceContext is always available when using middleware.
    const traceContext = getOrInjectContext(req, projectId, true);

    // Install a child logger on the request object, with detected trace and
    // span.
    (req as AnnotatedRequestType<LoggerType>).log = makeChildLogger(
      traceContext.trace,
      traceContext.spanId,
      traceContext.traceSampled
    );

    next();
  };
}
