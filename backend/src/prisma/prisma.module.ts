import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}


// By exporting PrismaService, we make services running through available in others modules and services
// We will need this Prisma module in every other services/modules (they all need to have access to the database)
// Instead of importing it in all of our modules -> making it GLOBAL ! Still need to be imported into our app.module