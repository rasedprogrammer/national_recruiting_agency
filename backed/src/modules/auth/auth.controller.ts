import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { HTTPSTATUS } from "../../config/http.config";
import {
  loginSchema,
  registerSchema,
} from "../../common/validators/auth.validator";
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookies,
} from "../../common/utils/cookies";
import { UnauthorizedException } from "../../common/utils/catch.error";

export class AuthController {
  public authService: AuthService;
  constructor(authService: AuthService) {
    this.authService = authService;
  }

  // Register Controller
  public register = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = registerSchema.parse({
        ...req.body,
      });
      const { user } = await this.authService.register(body);
      return res.status(HTTPSTATUS.CREATED).json({
        message: "User Resigtered Successfully.",
        data: user,
      });
    }
  );

  // Login Controller
  public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userAgent = req.headers["user-agent"];
      const body = loginSchema.parse({
        ...req.body,
        userAgent,
      });
      const { user, accessToken, refreshToken, mfaRequired } =
        await this.authService.login(body);

      return setAuthenticationCookies({
        res,
        accessToken,
        refreshToken,
      })
        .status(HTTPSTATUS.OK)
        .json({
          message: "User login Successfully.",
          data: user,
        });
    }
  );

  // Refresh Token Controller
  public refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const refreshToken = req.cookies.refreshToken as string | undefined;
      if (!refreshToken) {
        throw new UnauthorizedException("Missing refresh token");
      }
      const { accessToken, newRefreshToken } =
        await this.authService.refreshToken(refreshToken);
      if (newRefreshToken) {
        res.cookie(
          "refreshToken",
          newRefreshToken,
          getRefreshTokenCookieOptions()
        );
        return res
          .status(HTTPSTATUS.OK)
          .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
          .json({
            message: "Refresh access token successfully.",
          });
      }
    }
  );
}
