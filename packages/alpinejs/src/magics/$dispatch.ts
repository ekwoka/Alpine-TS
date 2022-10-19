import { magic } from '../magics';
import { dispatch } from '../utils/dispatch';

magic('dispatch', (el) => dispatch.bind(dispatch, el));
