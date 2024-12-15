import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { config } from "./config/app.config";
import connectDatabase from "./database/database";
import { errorHandler } from "./middlewares/errorHandler";
import { HTTPSTATUS } from "./config/http.config";
import { Error } from "mongoose";
import { asyncHandler } from "./middlewares/asyncHandler";
import authRoutes from "./modules/auth/auth.routes";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.APP_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());

// Caling Auth Router Here
app.use(`${BASE_PATH}/auth`, authRoutes);

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(HTTPSTATUS.OK).json({
      message: "Hello World",
    });
  })
);

app.use(errorHandler);

app.listen(config.PORT, async () => {
  console.log(`Server listing on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
});
