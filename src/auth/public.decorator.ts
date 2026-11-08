import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marks a controller or route as reachable without a login session.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
