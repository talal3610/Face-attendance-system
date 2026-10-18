// Configure these in the local environment before building the client.
// Values in a browser bundle are visible to users, so this is only suitable
// for the current demo flow and must not be treated as backend security.
export const ADMIN_USERNAME = process.env.REACT_APP_ADMIN_USERNAME || "";
export const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || "";

export const validateAdminCredentials = (username, password) =>
  username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

export const validateAdminPassword = (password) => password === ADMIN_PASSWORD;
