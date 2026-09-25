export const expressIdempotencyMiddleware = () => {
  return (req: any, res: any, next: any) => {
    next();
  };
};
