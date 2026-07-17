"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// If any Google Cloud tooling env vars are set on the machine, @google/genai
// auto-selects the Vertex/OAuth code path. Clear them to force Gemini
// Developer API (both AIza... and AQ... keys work with this path).
delete process.env.GOOGLE_GENAI_USE_VERTEXAI;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.GOOGLE_CLOUD_PROJECT;
delete process.env.GOOGLE_CLOUD_LOCATION;
const env_1 = require("./config/env");
const app_1 = require("./app");
const app = (0, app_1.createApp)();
app.listen(env_1.env.port, () => {
    console.log(`Trayyath backend running on http://localhost:${env_1.env.port}`);
});
