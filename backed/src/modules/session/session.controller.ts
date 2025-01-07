import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { SessionService } from "./session.service";
import { HTTPSTATUS } from "../../config/http.config";
import { NotFoundException } from "../../common/utils/catch-errors";
import { z } from "zod";

export class SessionController {
  private sessionService: SessionService;

  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  // Get All Session ID
  public getAllSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.sessionId;

    const { sessions } = await this.sessionService.getAllSession(userId);

    const modifySessions = sessions.map((session) => ({
      ...session.toObject(),
      ...(session.id === sessionId && {
        isCurrent: true,
      }),
    }));

    return res.status(HTTPSTATUS.OK).json({
      message: "Retrieved all session successfully",
      sessions: modifySessions,
    });
  });

  // Get Single Session ID
  public getSession = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req?.sessionId;

    if (!sessionId) {
      throw new NotFoundException("Session ID not found. Please log in.");
    }

    const { user } = await this.sessionService.getSessionById(sessionId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Session retrieved successfully",
      user,
    });
  });

  // Delete Session ID
  public deleteSession = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = z.string().parse(req.params.id);
    const userId = req.user?.id;
    await this.sessionService.deleteSession(sessionId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Session remove successfully",
    });
  });
}
