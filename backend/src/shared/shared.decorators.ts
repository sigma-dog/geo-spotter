import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): string => {
        const req = ctx
            .switchToHttp()
            .getRequest<{ user: { userId: string; email: string } }>();
        return req.user.userId;
    }
);
