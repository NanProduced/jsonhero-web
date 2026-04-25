import { JSONHeroPath } from "@jsonhero/path";

export type DiffType = "added" | "deleted" | "modified" | "unchanged";

export interface DiffNode {
  path: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface DiffResult {
  diffs: Map<string, DiffNode>;
  addedPaths: Set<string>;
  deletedPaths: Set<string>;
  modifiedPaths: Set<string>;
}

function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  );
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (isPrimitive(a) || isPrimitive(b)) {
    return a === b;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }

  return true;
}

function getType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function addDiff(
  result: DiffResult,
  path: string,
  type: DiffType,
  oldValue?: unknown,
  newValue?: unknown
): void {
  result.diffs.set(path, {
    path,
    type,
    oldValue,
    newValue,
  });

  switch (type) {
    case "added":
      result.addedPaths.add(path);
      break;
    case "deleted":
      result.deletedPaths.add(path);
      break;
    case "modified":
      result.modifiedPaths.add(path);
      break;
  }
}

function diffObjects(
  leftObj: Record<string, unknown>,
  rightObj: Record<string, unknown>,
  currentPath: JSONHeroPath,
  result: DiffResult
): void {
  const leftKeys = new Set(Object.keys(leftObj));
  const rightKeys = new Set(Object.keys(rightObj));

  const allKeys = new Set([...leftKeys, ...rightKeys]);

  for (const key of allKeys) {
    const cleanKey = key.replace(/\./g, "\\.");
    const childPath = currentPath.child(cleanKey);
    const pathString = childPath.toString();

    const inLeft = leftKeys.has(key);
    const inRight = rightKeys.has(key);

    if (!inLeft && inRight) {
      addDiff(result, pathString, "added", undefined, rightObj[key]);
      addNestedDiffs(rightObj[key], childPath, result, "added");
    } else if (inLeft && !inRight) {
      addDiff(result, pathString, "deleted", leftObj[key], undefined);
      addNestedDiffs(leftObj[key], childPath, result, "deleted");
    } else {
      const leftValue = leftObj[key];
      const rightValue = rightObj[key];

      if (!deepEqual(leftValue, rightValue)) {
        if (getType(leftValue) !== getType(rightValue)) {
          addDiff(result, pathString, "modified", leftValue, rightValue);
          addNestedDiffs(leftValue, childPath, result, "deleted");
          addNestedDiffs(rightValue, childPath, result, "added");
        } else if (isPrimitive(leftValue)) {
          addDiff(result, pathString, "modified", leftValue, rightValue);
        } else if (Array.isArray(leftValue)) {
          addDiff(result, pathString, "modified", leftValue, rightValue);
          diffArrays(
            leftValue as unknown[],
            rightValue as unknown[],
            childPath,
            result
          );
        } else {
          addDiff(result, pathString, "modified", leftValue, rightValue);
          diffObjects(
            leftValue as Record<string, unknown>,
            rightValue as Record<string, unknown>,
            childPath,
            result
          );
        }
      } else {
        addDiff(result, pathString, "unchanged", leftValue, rightValue);
      }
    }
  }
}

function diffArrays(
  leftArr: unknown[],
  rightArr: unknown[],
  currentPath: JSONHeroPath,
  result: DiffResult
): void {
  const maxLength = Math.max(leftArr.length, rightArr.length);

  for (let i = 0; i < maxLength; i++) {
    const childPath = currentPath.child(i.toString());
    const pathString = childPath.toString();

    const inLeft = i < leftArr.length;
    const inRight = i < rightArr.length;

    if (!inLeft && inRight) {
      addDiff(result, pathString, "added", undefined, rightArr[i]);
      addNestedDiffs(rightArr[i], childPath, result, "added");
    } else if (inLeft && !inRight) {
      addDiff(result, pathString, "deleted", leftArr[i], undefined);
      addNestedDiffs(leftArr[i], childPath, result, "deleted");
    } else {
      const leftValue = leftArr[i];
      const rightValue = rightArr[i];

      if (!deepEqual(leftValue, rightValue)) {
        if (getType(leftValue) !== getType(rightValue)) {
          addDiff(result, pathString, "modified", leftValue, rightValue);
          addNestedDiffs(leftValue, childPath, result, "deleted");
          addNestedDiffs(rightValue, childPath, result, "added");
        } else if (isPrimitive(leftValue)) {
          addDiff(result, pathString, "modified", leftValue, rightValue);
        } else if (Array.isArray(leftValue)) {
          addDiff(result, pathString, "modified", leftValue, rightValue);
          diffArrays(
            leftValue as unknown[],
            rightValue as unknown[],
            childPath,
            result
          );
        } else {
          addDiff(result, pathString, "modified", leftValue, rightValue);
          diffObjects(
            leftValue as Record<string, unknown>,
            rightValue as Record<string, unknown>,
            childPath,
            result
          );
        }
      } else {
        addDiff(result, pathString, "unchanged", leftValue, rightValue);
      }
    }
  }
}

function addNestedDiffs(
  value: unknown,
  currentPath: JSONHeroPath,
  result: DiffResult,
  diffType: "added" | "deleted"
): void {
  if (isPrimitive(value)) return;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const childPath = currentPath.child(i.toString());
      const pathString = childPath.toString();
      addDiff(
        result,
        pathString,
        diffType,
        diffType === "deleted" ? value[i] : undefined,
        diffType === "added" ? value[i] : undefined
      );
      addNestedDiffs(value[i], childPath, result, diffType);
    }
  } else {
    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const cleanKey = key.replace(/\./g, "\\.");
      const childPath = currentPath.child(cleanKey);
      const pathString = childPath.toString();
      addDiff(
        result,
        pathString,
        diffType,
        diffType === "deleted" ? obj[key] : undefined,
        diffType === "added" ? obj[key] : undefined
      );
      addNestedDiffs(obj[key], childPath, result, diffType);
    }
  }
}

export function computeJsonDiff(leftJson: unknown, rightJson: unknown): DiffResult {
  const result: DiffResult = {
    diffs: new Map(),
    addedPaths: new Set(),
    deletedPaths: new Set(),
    modifiedPaths: new Set(),
  };

  const rootPath = new JSONHeroPath("$");

  if (deepEqual(leftJson, rightJson)) {
    addDiff(result, "$", "unchanged", leftJson, rightJson);
    return result;
  }

  const leftType = getType(leftJson);
  const rightType = getType(rightJson);

  if (leftType !== rightType) {
    addDiff(result, "$", "modified", leftJson, rightJson);
    addNestedDiffs(leftJson, rootPath, result, "deleted");
    addNestedDiffs(rightJson, rootPath, result, "added");
    return result;
  }

  addDiff(result, "$", "modified", leftJson, rightJson);

  if (Array.isArray(leftJson) && Array.isArray(rightJson)) {
    diffArrays(leftJson, rightJson, rootPath, result);
  } else if (
    typeof leftJson === "object" &&
    typeof rightJson === "object" &&
    leftJson !== null &&
    rightJson !== null
  ) {
    diffObjects(
      leftJson as Record<string, unknown>,
      rightJson as Record<string, unknown>,
      rootPath,
      result
    );
  }

  return result;
}

export function getDiffTypeForPath(
  diffResult: DiffResult,
  path: string,
  side: "left" | "right"
): DiffType | null {
  const diff = diffResult.diffs.get(path);
  if (!diff) return null;

  if (diff.type === "unchanged") return "unchanged";

  if (side === "left") {
    if (diff.type === "deleted") return "deleted";
    if (diff.type === "modified") return "modified";
    return null;
  } else {
    if (diff.type === "added") return "added";
    if (diff.type === "modified") return "modified";
    return null;
  }
}

export function hasAncestorDiff(
  diffResult: DiffResult,
  path: string,
  types: DiffType[]
): boolean {
  const heroPath = new JSONHeroPath(path);
  const components = heroPath.components;

  for (let i = 0; i < components.length - 1; i++) {
    const ancestorPath = new JSONHeroPath(components.slice(0, i + 1)).toString();
    const diff = diffResult.diffs.get(ancestorPath);
    if (diff && types.includes(diff.type)) {
      return true;
    }
  }

  return false;
}
