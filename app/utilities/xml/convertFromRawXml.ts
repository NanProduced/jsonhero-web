import { DOMParser } from "@xmldom/xmldom";

export type SerializedXMLObject = {
  [key: string]: any;
  $attributes?: { [key: string]: any };
  $values?: any[];
};

const getCleanXmlString = (xmlString: string): string => {
  const cleanXmlString = xmlString
    .replace(/(\r\n|\n|\r)/gm, "")
    .replace(/>\s+</g, "><");
  return cleanXmlString;
};

const getSafeNodeName = (nodeName: string): string => {
  if (!nodeName) return "node";
  
  const colonIndex = nodeName.indexOf(":");
  if (colonIndex > 0 && colonIndex < nodeName.length - 1) {
    return nodeName.substring(colonIndex + 1);
  }
  
  return nodeName;
};

const serializeXml = (
  node: ChildNode & { attributes?: NamedNodeMap; prefix?: string; namespaceURI?: string }
): SerializedXMLObject | string | null | undefined => {
  if (!node) {
    return undefined;
  }

  const { nodeName, nodeType, nodeValue } = node;

  if (nodeType === 3) {
    return nodeValue !== null && nodeValue !== undefined ? nodeValue : undefined;
  }

  if (nodeType === 8) {
    return undefined;
  }

  let childNodesArray: ChildNode[] = [];
  if (node.childNodes && node.childNodes.length > 0) {
    childNodesArray = Array.from(node.childNodes);
  }

  const children = childNodesArray
    .map((child) => serializeXml(child))
    .filter((child) => child !== undefined && child !== null);

  let attributes: { [key: string]: any } | undefined;
  if (node.attributes && node.attributes.length > 0) {
    try {
      attributes = Array.from(node.attributes).reduce(
        (acc: { [key: string]: any }, attr: any) => {
          if (attr && attr.name !== undefined && attr.value !== undefined) {
            const safeName = getSafeNodeName(attr.name);
            acc[safeName] = attr.value;
          }
          return acc;
        },
        {}
      );
      if (Object.keys(attributes).length === 0) {
        attributes = undefined;
      }
    } catch {
      attributes = undefined;
    }
  }

  const safeNodeName = getSafeNodeName(nodeName);
  let childObject: SerializedXMLObject = {};

  if (children.length === 0) {
    childObject[safeNodeName] = "";
  } else if (children.length === 1 && typeof children[0] === "string") {
    childObject[safeNodeName] = children[0];
  } else {
    childObject[safeNodeName] = {};

    const validChildren = children.filter((child) => 
      child !== null && 
      typeof child === "object" && 
      !Array.isArray(child)
    ) as SerializedXMLObject[];

    if (validChildren.length > 0) {
      const childKeys: string[] = [];
      for (const child of validChildren) {
        if (child && typeof child === "object") {
          const keys = Object.keys(child);
          if (keys.length > 0) {
            childKeys.push(keys[0]);
          }
        }
      }

      const uniqueKeys = new Set(childKeys);

      if (uniqueKeys.size === validChildren.length && uniqueKeys.size > 0) {
        childObject[safeNodeName] = validChildren.reduce(
          (acc: {}, child: any) => ({ ...acc, ...child }),
          {}
        );
      } else {
        childObject[safeNodeName].$values = children;
      }
    } else {
      childObject[safeNodeName].$values = children;
    }
  }

  if (attributes && Object.keys(attributes).length > 0) {
    if (typeof childObject[safeNodeName] !== "object" || childObject[safeNodeName] === null) {
      const textValue = childObject[safeNodeName];
      childObject[safeNodeName] = {};
      if (textValue !== undefined && textValue !== "") {
        childObject[safeNodeName].$text = textValue;
      }
    }
    childObject[safeNodeName].$attributes = attributes;
  }

  return childObject;
};

export default function convertFromRawXml(xmlString: string): string {
  const cleanXmlString = getCleanXmlString(xmlString);

  let xmlDoc: Document;
  try {
    xmlDoc = new DOMParser({
      errorHandler: {
        warning: () => {},
        error: () => {
          throw new Error("Invalid XML");
        },
        fatalError: () => {
          throw new Error("Invalid XML");
        },
      },
    }).parseFromString(cleanXmlString, "application/xml");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Invalid XML");
  }

  if (!xmlDoc || !xmlDoc.documentElement) {
    throw new Error("Invalid XML");
  }

  let childNodesArray: ChildNode[] = [];
  if (xmlDoc.childNodes && xmlDoc.childNodes.length > 0) {
    childNodesArray = Array.from(xmlDoc.childNodes);
  }

  const serialized = childNodesArray
    .map((node) => serializeXml(node))
    .filter((node) => node !== undefined && node !== null);

  return JSON.stringify(serialized);
}
