// packages/db/src/index.ts
export type { DB } from './interface';
export { CREATE_TABLES_SQL } from './schema';
export { createMobileDB } from './drivers/mobile';
export { createWebDB } from './drivers/web';
export { BUILT_IN_EXERCISES } from './seed/exercises';
export { BUILT_IN_PROGRAMS, BUILT_IN_ROUTINES, BUILT_IN_ROUTINE_EXERCISES } from './seed/programs';
