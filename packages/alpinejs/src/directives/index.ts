import { directive } from '../directives';
import { warn } from '../utils/warn';
import './x-bind';
import './x-cloak';
import './x-data';
import './x-effect';
import './x-for';
import './x-html';
import './x-id';
import './x-if';
import './x-ignore';
import './x-init';
import './x-model';
import './x-modelable';
import './x-on';
import './x-ref';
import './x-show';
import './x-teleport';
import './x-text';
import './x-transition';

// Register warnings for people using plugin syntaxes and not loading the plugin itself:

const warnMissingPluginDirective = (
  name: string,
  directiveName: string,
  slug: string
) =>
  directive(directiveName, (el) =>
    warn(
      `You can't use [x-${directiveName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`,
      el
    )
  );

warnMissingPluginDirective('Collapse', 'collapse', 'collapse');
warnMissingPluginDirective('Intersect', 'intersect', 'intersect');
warnMissingPluginDirective('Focus', 'trap', 'focus');
warnMissingPluginDirective('Mask', 'mask', 'mask');
