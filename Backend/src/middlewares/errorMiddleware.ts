import { Request, Response, NextFunction } from "express";
import logger from "../logger";

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({
    message: err.message,
    url: req.url,
    method: req.method,
    headers: req.headers,
  });

  if (err instanceof NotFoundError) {
    res.status(404).json({ message: err.message, errorCode: "NOT_FOUND" });
  } else if ("errors" in err) {
    res
      .status(400)
      .json({ message: err.message, errorCode: "VALIDATION_ERROR" });
  } else {
    res
      .status(500)
      .json({ message: err.message, errorCode: "INTERNAL_SERVER_ERROR" });
  }
};
