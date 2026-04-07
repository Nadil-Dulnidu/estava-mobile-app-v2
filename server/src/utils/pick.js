const pick = (source, keys = []) => {
  const output = {};

  keys.forEach((key) => {
    if (Object.hasOwn(source, key) && source[key] !== undefined) {
      output[key] = source[key];
    }
  });

  return output;
};

export default pick;
