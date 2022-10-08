export function debounce(func, wait) {
  var timeout;

  return function () {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    var context = this,
      args = arguments;

    var later = function () {
      timeout = null;

      func.apply(context, args);
    };

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);
  };
}
