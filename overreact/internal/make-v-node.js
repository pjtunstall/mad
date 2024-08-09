export function makeVNode(tagName, { attrs = {}, children = [] } = {}) {
  if (typeof tagName !== "string") {
    throw new Error("tagName must be a string");
  }

  if (typeof attrs !== "object") {
    throw new Error("attrs must be an object");
  }

  if (!Array.isArray(children)) {
    throw new Error("children must be an array");
  }

  return {
    tagName,
    attrs,
    children,
  };
}
