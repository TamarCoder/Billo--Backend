import { ArgumentsHost, Catch, ConflictException, type ExceptionFilter } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION = '23505';

// Two requests at once can both pass a "does it exist?" check; the database
// unique index then rejects one. Answer 409 instead of a 500.
@Catch(QueryFailedError)
export class UniqueViolationFilter extends BaseExceptionFilter implements ExceptionFilter {
  override catch(error: QueryFailedError, host: ArgumentsHost): void {
    const code = (error.driverError as { code?: string } | undefined)?.code;
    if (code === UNIQUE_VIOLATION) {
      super.catch(new ConflictException('ასეთი ჩანაწერი უკვე არსებობს.'), host);
      return;
    }
    super.catch(error, host);
  }
}
