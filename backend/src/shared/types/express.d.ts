import { TokenPayload } from '@/shared/utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
