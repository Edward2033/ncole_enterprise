import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response';
import { chat, ChatDto } from './ai.service';
import { prisma } from '@/config/database';
import { audit } from '@/shared/utils/audit';

export async function chatHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as ChatDto;
    const userId = req.user?.sub;

    let userName: string | undefined;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      userName = user?.name;
    }

    const reply = await chat(dto, userId, userName);
    audit({ userId, action: 'AI_INTERACTION', metadata: { portal: dto.portal, messageLength: dto.message.length } });
    sendSuccess(res, { reply });
  } catch (e) {
    next(e);
  }
}
