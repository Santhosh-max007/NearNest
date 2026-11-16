const serverless = require("serverless-http");
const app = require("../../backend/app");
const proxy = serverless(app);

exports.handler = async (event, context) => {
  // Netlify rewrites /api/* to /.netlify/functions/api/api/* .
  // Strip only the function prefix so Express receives /api/... .
  const prefix = "/.netlify/functions/api";
  if (event.path && event.path.startsWith(prefix)) {
    event.path = event.path.slice(prefix.length) || "/";
  }
  return proxy(event, context);
};
