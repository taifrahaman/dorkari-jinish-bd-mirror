import intlMiddleware from "./middlewares/intl";
export default intlMiddleware;
export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
