export {
  setupAuth,
  authenticateRequest,
  isAuthenticated,
  getSession,
  invalidateUserActiveCache,
} from "./replitAuth";
export type { AuthenticationResult } from "./replitAuth";
export { authStorage, type IAuthStorage } from "./storage";
export { registerAuthRoutes } from "./routes";
