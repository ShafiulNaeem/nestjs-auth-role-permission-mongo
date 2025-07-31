import { Global, Module } from '@nestjs/common';
import { UniqueConstraint } from '../decorators/unique.decorator';
import { ExistsConstraint } from '../decorators/exists.decorator';

/**
 * Global validation module that provides custom validation decorators
 * across the entire application
 */
@Global()
@Module({
    providers: [
        UniqueConstraint,
        ExistsConstraint,
    ],
    exports: [
        UniqueConstraint,
        ExistsConstraint,
    ],
})
export class ValidationModule { }
