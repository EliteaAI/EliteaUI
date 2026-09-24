// Side-effect imports: each slice registers its reducer with the shared store when loaded.
// Every slice that calls registerReducer must be listed here. Otherwise its state stays undefined
// until some lazy chunk imports it, and raw state.x selectors will crash.
import '@/[fsd]/entities/import-wizard/model';
import '@/[fsd]/features/skill-hub/model';
import '@/[fsd]/features/toolkits/indexes/model';
import { sealReducerRegistry } from '@/[fsd]/shared/config/reducerRegistry';

sealReducerRegistry();
