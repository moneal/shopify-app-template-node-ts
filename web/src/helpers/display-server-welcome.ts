import { getLogger } from "../middleware";

export const displayServerWelcome = ({
  port,
  isProd = true,
}: {
  port: number;
  isProd?: boolean;
}): void => {
  const startupMessage = isProd
    ? `Backend server is running in production mode 🚀 `
    : `Backend server is running in development mode 🧑‍💻`;

  getLogger().info(`**********************************************************
*** ${startupMessage} ***
**********************************************************`);

  if (!process.env.GCP_PROJECT) {
    getLogger().error(`********************************************************
  *** GCP_PROJECT= environment variable is not set  ***
  ********************************************************`);
    if (!isProd) {
      getLogger().warn(
        `Try: GCP_PROJECT="demo-app" FIRESTORE_EMULATOR_HOST=localhost:8080 npm run dev`
      );
    }
    throw new Error(`GCP_PROJECT environment variable is not set`);
  }

  getLogger().info(`☁️  GCP Project ID: ${process.env.GCP_PROJECT}`);

  getLogger().info(`🌐 Host: ${process.env.HOST}`);
};
