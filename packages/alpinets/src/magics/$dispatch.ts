import { magic } from '../magics';
import { dispatch } from '../utils/dispatch';

magic('dispatch', (el) => dispatch.bind(dispatch, el));

declare module '../magics' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Magics<T> {
    /**
     * Dispatch browser events.
     *
     * @param event the event name
     * @param data an event-dependent value associated with the event, the value is then available to the handler using the CustomEvent.detail property
     */
    $dispatch: (event: string, detail?: unknown) => void;
  }
}
