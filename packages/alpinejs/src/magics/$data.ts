import { magic } from '../magics';
import { scope } from '../scope';

magic('data', (el) => scope(el));
