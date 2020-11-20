import { hasProperties } from './helpers';

export function requiredBody(...args: any[]) {

  return async (req: any, res: any, next: Function) => {
    if (!hasProperties(req.body, args)) {
      return res
        .status(400)
        .send({ status: "failed", reason: "Missing arguments", required: args });
    }

    next();
  };
}