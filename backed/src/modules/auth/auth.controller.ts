import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { HTTPSTATUS } from "../../config/http.config";
import { registerSchema } from "../../common/validators/auth.validator";

export class AuthController {
  public authService: AuthService;
  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public register = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userAgent = req.headers["user-agent"];
      const body = registerSchema.parse({
        ...req.body,
        userAgent,
      });
      this.authService.register(body);
      return res.status(HTTPSTATUS.CREATED).json({
        message: "User Resigtered Successfully.",
      });
    }
  );
}
