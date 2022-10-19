import { magic } from '../magics';
import { warn } from '../utils/warn';
import './$data';
import './$dispatch';
import './$el';
import './$id';
import './$nextTick';
import './$refs';
import './$root';
import './$store';
import './$watch';

// Register warnings for people using plugin syntaxes and not loading the plugin itself:
const warnMissingPluginMagic = (
  name: string,
  magicName: string,
  slug: string
) => {
  magic(magicName, (el) =>
    warn(
      `You can't use [$${magicName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`,
      el
    )
  );
};

warnMissingPluginMagic('Focus', 'focus', 'focus');
warnMissingPluginMagic('Persist', 'persist', 'persist');
